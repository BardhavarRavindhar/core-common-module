/**
 * @module ServiceActions
 * 
 * This module provides functions to interact with the Service model,
 * including fetching hierarchical service data.
 */

import Service from "../models/service.model.js";
import ModelError from "../exceptions/model.error.js";
import logger from "../utils/logger.util.js";
import escapeRegExp from "../utils/escape-regex.util.js";


/**
 * Fetches services in a hierarchical structure where level 0 services contain their
 * level 1 children (L1), which in turn contain their level 2 children (L2).
 * 
 * @param {Object} options - Query options
 * @param {string} options.featured - Query parameters for filtering services
 * @param {string} options.parentService - Query parameters for filtering services by parent service
 * @param {string} options.search - Query parameters for filtering services by name
 * @param {Number} options.limit - Maximum number of top-level services to return (defaults to 10)
 * @param {Number} options.skip - Number of top-level services to skip (for pagination)
 * @param {Number} options.page - Number of top-level services to page (for pagination)
 * @returns {Promise<Object>} - Object containing hierarchical service data and metadata
 */
export const fetchHierarchicalServices = async (options = {}) => {
  try {
    const {
      featured,
      limit = 10,
      skip = 0,
      page = 1,
      parentService,
      search
    } = options;

    // Build base query
    let query = { enabled: true };

    if (featured !== undefined && (featured === "true" || featured === "false")) {
      query.featured = featured === "true";
    }

    if (parentService && Service.isValidID(parentService)) {
      query.parentService = parentService;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const escapedSearch = escapeRegExp(search.trim());
      query.name = { $regex: escapedSearch, $options: "i" };
    }

    logger.info(`Fetching hierarchical services with query: ${JSON.stringify(query)}`);

    const pageNum = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || limit;
    const skipItems = (pageNum - 1) * itemsPerPage;

    // Determine root level
    let startLevel = 0;
    let rootFilter = { ...query, level: startLevel };

    if (query.parentService) {
      const parent = await Service.findById(query.parentService).lean();
      if (parent) {
        startLevel = parent.level + 1;
        rootFilter = { ...query, parentService: query.parentService, level: startLevel };
      }
    }

    const rootServices = await Service.find(rootFilter)
      .sort({ name: 1 })
      .skip(skipItems)
      .limit(itemsPerPage)
      .lean();

    const totalCount = await Service.countDocuments(rootFilter);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const rootIds = rootServices.map(s => s._id);
    let hierarchicalData = [];

    if (startLevel <= 1) {
      let level1Services = [];
      if (startLevel === 0 && rootIds.length > 0) {
        level1Services = await Service.find({
          ...query,
          parentService: { $in: rootIds },
          level: 1
        }).sort({ name: 1 }).lean();
      }

      const level1Ids = level1Services.map(s => s._id);
      let level2Services = [];

      if ((startLevel === 0 && level1Ids.length > 0) || (startLevel === 1 && rootIds.length > 0)) {
        const level2Filter = startLevel === 0
          ? { ...query, parentService: { $in: level1Ids }, level: 2 }
          : { ...query, parentService: { $in: rootIds }, level: 2 };

        level2Services = await Service.find(level2Filter).sort({ name: 1 }).lean();
      }

      if (startLevel === 0) {
        hierarchicalData = rootServices.map(root => {
          const L1 = level1Services
            .filter(l1 => l1.parentService?.toString() === root._id.toString())
            .map(l1 => {
              const L2 = level2Services.filter(
                l2 => l2.parentService?.toString() === l1._id.toString()
              );
              return { ...l1, L2 };
            });

          return { ...root, L1 };
        });
      } else if (startLevel === 1) {
        hierarchicalData = rootServices.map(l1 => {
          const L2 = level2Services.filter(
            l2 => l2.parentService?.toString() === l1._id.toString()
          );
          return { ...l1, L2 };
        });
      }
    } else {
      hierarchicalData = rootServices; // level 2 or above, no children
    }

    return {
      success: true,
      code: "OK",
      message: "Hierarchical services retrieved successfully.",
      metadata: {
        count: totalCount,
        query,
        sorting: {
          sortKey: "name",
          sortOrder: "asc"
        },
        pagination: {
          limit: itemsPerPage,
          skip: skipItems,
          page: pageNum,
          totalPages
        }
      },
      data: hierarchicalData
    };
  } catch (error) {
    logger.error("Error in fetchHierarchicalServices:", error);

    if (error instanceof ModelError) throw error;

    throw new ModelError({
      message: error.message || "Failed to fetch hierarchical services",
      code: "INTERNAL_SERVER_ERROR",
      errors: error
    });
  }
};


export default {
  fetchHierarchicalServices
};