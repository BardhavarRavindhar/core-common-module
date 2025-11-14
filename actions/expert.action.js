/**
 * @module ExpertAction
 *
 * This module defines the actions related to user and its bio.
 */
import UserModel from "../models/user.model.js";
import ApiError from "../exceptions/api.error.js";

/**
 * @method showProfessionalProfile
 * Retrieves the complete professional profile for an expert user
 * @param {string} identity - The expert's user ID
 * @returns {Promise<Object>} - The complete expert profile with all required fields
 */
const showProfessionalProfile = async (identity) => {
  const populates = [
    {
      path: "profile",
      model: "Profile",
      select: "+about -user -address",
    },
    {
      path: "profileInterest",
      select: "interests",
      populate: {
        path: "interests",
        model: "Interest",
        select: "name", // Only include the name field from Interest documents
      },
    },
    {
      path: "socials.social",
      select: "name icon", // Include fields to populate
    },
    {
      path: "wallet",
      model: "Wallet",
    },
    {
      path: "spokenLanguages",
      model: "Language",
      select: "name code",
    },
    {
      path: "profileExpertise",
      model: "Proficiency",
      select: "expertises", // Only include the expertises field from Proficiency
      populate: {
        path: "expertises.expertise", // Using dot notation to reach the nested expertise field
        model: "Expertise",
        select: "name", // Only include the name field from Expertise
      },
    },
    {
      path: "profileExperience",
    },
    {
      path: "profileEducation",
    },
    {
      path: "profileAchievement",
    },
    {
      path: "profileExpertRate",
    },
    {
      path: "profileExpertService",
      populate: [
        { path: "serviceGroup", select: "name code enabled" },
        { path: "ancentor", select: "name code enabled" },
        { path: "services", select: "name code enabled" },
      ],
    },
  ];
  const profile = await UserModel.findById(identity).populate(populates).exec();

  return profile;
};

/**
 * @method getTopExperts
 * Fetches top experts based on profile and enrollment dates
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Collection of experts
 */
export const getTopExperts = async (params) => {
  // Build filter query
  const filterQuery = {
    status: "ACTIVE",
    expertEnrolledAt: { $ne: null },
    // expertProfileAt: { $ne: null },
  };

  // Add date filters if provided
  if (params.expertProfileAt) {
    filterQuery.expertProfileAt = {
      $gte: new Date(params.expertProfileAt),
    };
  }

  if (params.expertEnrolledAt) {
    filterQuery.expertEnrolledAt = {
      $gte: new Date(params.expertEnrolledAt),
    };
  }

  // Define fields to populate
  const populates = [
    {
      path: "profile",
      model: "Profile",
      select: "+about -user -address",
    },
    {
      path: "profileInterest",
      select: "interests",
      populate: {
        path: "interests",
        model: "Interest",
        select: "name", // Only include the name field from Interest documents
      },
    },
    {
      path: "socials.social",
      select: "name icon", // Include fields to populate
    },
    // {
    //   path: "wallet",
    //   model: 'Wallet'
    // },
    {
      path: "spokenLanguages",
      model: "Language",
      select: "name",
    },
    {
      path: "profileExpertise",
      model: "Proficiency",
      select: "expertises", // Only include the expertises field from Proficiency
      populate: {
        path: "expertises.expertise", // Using dot notation to reach the nested expertise field
        model: "Expertise",
        select: "name", // Only include the name field from Expertise
      },
    },
    {
      path: "profileExperience",
    },
    {
      path: "profileEducation",
    },
    {
      path: "profileAchievement",
    },
    {
      path: "profileExpertRate",
      select: "user rates enabledTrial enabledGST enabledPlan",
    },
    {
      path: "profileExpertService",
      populate: [
        { path: "serviceGroup", select: "name code enabled" },
        { path: "ancentor", select: "name code enabled" },
        { path: "services", select: "name code enabled" },
      ],
    },
  ];

  // Define sort criteria
  const sort = {
    expertEnrolledAt: -1, // Sort by enrollment date descending
    expertProfileAt: -1, // Then by profile creation date descending
  };

  // Get collection with pagination
  const collection = await UserModel.manageSearchPayload(
    filterQuery,
    { ...params, sort },
    populates
  );

  return collection;
};

/**
 * Transforms a full expert document into a lightweight DTO
 * @param {Object} expert - Expert user document
 * @returns {Object} - Minimized expert data transfer object
 */
const transformToExpertDTO = (expert) => {
  return {
    id: expert._id,
    username: expert.username,
    displayName: expert.displayName,
    name: expert.profile.name,
    rating: expert.topRating || 0,
    imageUrl: expert.photo,
    online: expert.online,
    enabledTrial: expert.profileExpertRate?.enabledTrial || false,
    topRating: expert.topRating,
    languages: expert.languages,

    expertise: Array.isArray(expert.profileExpertise?.expertises)
      ? expert.profileExpertise.expertises
          .slice(0, 5) // Only return top 5 expertise areas
          .map((e) => ({
            name: e.expertise?.name,
          }))
          .filter((e) => e.name) // Filter out any with missing names
      : [],

    services: expert.profileExpertService
      ? {
          groupName: expert.profileExpertService.serviceGroup?.name,
          services: Array.isArray(expert.profileExpertService.services)
            ? expert.profileExpertService.services.map((s) => s.name)
            : [],
          designation: expert.profileExpertService?.designation || "",
        }
      : null,
    pricing: expert.profileExpertRate
      ? {
          audio: expert.profileExpertRate.rates?.audio?.cost
            ? expert.profileExpertRate.rates.audio.cost.toString()
            : null,
          video: expert.profileExpertRate.rates?.video?.cost
            ? expert.profileExpertRate.rates.video.cost.toString()
            : null,
          message: expert.profileExpertRate.rates?.message?.cost
            ? expert.profileExpertRate.rates.message.cost.toString()
            : null,
        }
      : null,
  };
};

/**
 * @method getTopExpertsList
 * Fetches top experts with optimized data payload
 * @param {Object} params - Query parameters including:
 *   - limit: Number of records to return (default: 10, max: 50)
 *   - skip: Number of records to skip (default: 0)
 *   - sortBy: Field to sort by (default: 'trending')
 *   - availableNow: Filter for experts who are currently online
 *   - consultationType: Filter by 'video', 'audio', or 'message' consultation types
 *   - minPrice: Minimum price for the selected consultation type
 *   - maxPrice: Maximum price for the selected consultation type
 *   - expertise: Filter by expertise name (case-insensitive regex match)
 *   - minRating: Filter by minimum rating (3 for 3+ stars, 4 for 4+ stars)
 *   - language: Filter by spoken language (case-insensitive regex match)
 * @returns {Promise<Object>} - Collection of experts with pagination metadata
 */
export const getTopExpertsList = async (params = {}, identity) => {
  try {
    // Build base filter query
    const filterQuery = {
      status: "ACTIVE",
      expertEnrolledAt: { $ne: null },
      forSystem: false, // Exclude system users
      _id: { $ne: identity },
    };

    /**
     * Filter for experts who are currently online
     * Checks the 'online' boolean field in the user document
     */
    if (params.availableNow === "true") {
      filterQuery.status = "ACTIVE";
    }

    /**
     * Initial filter to get experts with rate profiles
     * Required for consultation type and price filtering
     */
    if (params.consultationType || params.minPrice || params.maxPrice) {
      // First check if the expert has a rate profile
      filterQuery.profileExpertRate = { $exists: true, $ne: null };
    }

    /**
     * Filter experts by expertise area
     * Uses case-insensitive regex matching on expertise names
     */
    if (params.expertise) {
      // Make sure profileExpertise exists
      filterQuery.profileExpertise = { $exists: true, $ne: null };
    }

    /**
     * Filter experts by minimum rating
     * - minRating=3: Returns experts with 3.0-3.9 stars
     * - minRating=4: Returns experts with 4.0-5.0 stars
     */
    if (params.minRating) {
      const minRating = parseFloat(params.minRating);
      if (minRating === 3) {
        filterQuery.topRating = { $gte: 3, $lt: 4 };
      } else if (minRating === 4) {
        filterQuery.topRating = { $gte: 4 };
      }
    }

    /**
     * Filter experts by language code
     * Uses the direct languages array which contains language codes like "en", "hi"
     */
    if (params.language) {
      filterQuery.languages = params.language.toLowerCase();
    }

    // Define essential fields to select
    const selectFields =
      "displayName photo name username displayName topRating trendingScore expertEnrolledAt location languages timezone online";

    // Define minimal fields to populate based on view requirements
    const populates = [
      {
        path: "profile",
        select: "name about gender",
      },
      {
        path: "profileExpertise",
        select: "expertises",
        populate: {
          path: "expertises.expertise",
          select: "name",
        },
      },
      {
        path: "profileExpertRate",
        select: "rates enabledTrial",
      },
      {
        path: "profileExpertTiming",
        select: "availability",
      },
      {
        path: "spokenLanguages",
        select: "name code",
      },
      {
        path: "profileExpertService",
        select: "designation serviceGroup services",
        populate: [
          { path: "serviceGroup", select: "name" },
          { path: "services", select: "name" },
        ],
      },
    ];

    // Apply pagination with safety limits
    const limit = Math.min(parseInt(params.limit) || 10, 50);
    const skip = Math.max(parseInt(params.skip) || 0, 0);

    // Define sorting options
    const sortOptions = {
      rating: { topRating: -1 },
      trending: { trendingScore: -1 },
      newest: { expertEnrolledAt: -1 },
      oldest: { expertEnrolledAt: 1 },
      name: { displayName: 1 },
      price_high: { "profileExpertRate.rates.video.cost": -1 },
      price_low: { "profileExpertRate.rates.video.cost": 1 },
    };

    // Get sort option from params or default to trending
    const sortKey = params.sortBy || "trending";
    const sortOrder = sortOptions[sortKey] || sortOptions.trending;

    // Count total matching experts before applying pagination
    const totalCount = await UserModel.countDocuments(filterQuery);

    // Get collection with pagination, projection and population
    let experts = await UserModel.find(filterQuery)
      .select(selectFields)
      .populate(populates)
      .skip(skip)
      .limit(limit)
      .sort(sortOrder)
      .lean();

    /**
     * Post-query filter for expertise
     * Filters experts based on whether they have expertise matching the specified name pattern
     * @param {string} expertise - The expertise name pattern to search for
     * @returns {boolean} - True if the expert has matching expertise, false otherwise
     */
    if (params.expertise) {
      const expertisePattern = new RegExp(params.expertise, "i");
      experts = experts.filter((expert) => {
        // Check if expert has profileExpertise and expertises
        if (
          !expert.profileExpertise ||
          !Array.isArray(expert.profileExpertise.expertises)
        ) {
          return false;
        }

        // Check if any expertise name matches the pattern
        return expert.profileExpertise.expertises.some(
          (exp) =>
            exp.expertise &&
            exp.expertise.name &&
            expertisePattern.test(exp.expertise.name)
        );
      });
    }

    /**
     * Post-query filter for consultation type
     * Filters experts based on whether they have the requested consultation type
     * in their rate profile. This handles the MongoDB Map structure correctly.
     * @param {string} type - The consultation type to filter by ('video', 'audio', 'message')
     * @returns {boolean} - True if the expert has the consultation type, false otherwise
     */
    if (params.consultationType) {
      const type = params.consultationType.toLowerCase();
      experts = experts.filter((expert) => {
        // Check if expert has profileExpertRate and rates
        if (!expert.profileExpertRate || !expert.profileExpertRate.rates) {
          return false;
        }

        // Check if it's an object with the key
        return (
          (typeof expert.profileExpertRate.rates === "object" &&
            expert.profileExpertRate.rates.hasOwnProperty(type)) ||
          // Check if it exists as a property
          expert.profileExpertRate.rates[type] != null ||
          // Check MongoDB Map structure (entries as an array)
          (Array.isArray(expert.profileExpertRate.rates) &&
            expert.profileExpertRate.rates.some((entry) => entry[0] === type))
        );
      });
    }

    /**
     * Post-query filter for price range across all consultation types
     * Filters experts based on price ranges across video, audio, and message consultation types
     * This handles the MongoDB Map structure correctly, extracting costs from all rate types.
     * @param {number} minPrice - The minimum price to filter by
     * @param {number} maxPrice - The maximum price to filter by
     * @returns {boolean} - True if the expert has any consultation type within the price range
     */
    if ((params.minPrice || params.maxPrice) && experts.length > 0) {
      const minPrice = params.minPrice ? parseFloat(params.minPrice) : 0;
      const maxPrice = params.maxPrice
        ? parseFloat(params.maxPrice)
        : Number.MAX_VALUE;

      experts = experts.filter((expert) => {
        if (!expert.profileExpertRate || !expert.profileExpertRate.rates) {
          return false;
        }

        // Check all consultation types: video, audio, message
        const consultationTypes = ["video", "audio", "message"];

        // Return true if any consultation type meets the price criteria
        return consultationTypes.some((type) => {
          // Get the rate for the consultation type
          let rate;
          if (typeof expert.profileExpertRate.rates === "object") {
            rate = expert.profileExpertRate.rates[type];
          } else if (Array.isArray(expert.profileExpertRate.rates)) {
            const rateEntry = expert.profileExpertRate.rates.find(
              (entry) => entry[0] === type
            );
            rate = rateEntry ? rateEntry[1] : null;
          }

          if (!rate || !rate.cost) {
            return false;
          }

          // Convert cost to number if it's not already
          let cost = rate.cost;
          if (typeof cost === "string") {
            cost = parseFloat(cost);
          } else if (cost.toString && typeof cost !== "number") {
            // Handle Decimal128 or other object types
            cost = parseFloat(cost.toString());
          }

          // Check if cost is within the price range
          return cost >= minPrice && cost <= maxPrice;
        });
      });
    }

    // Transform data to minimized DTOs
    const expertDTOs = experts.map(transformToExpertDTO);

    return {
      data: expertDTOs,
      metadata: {
        count: totalCount,
        pagination: {
          limit,
          skip,
          page: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(totalCount / limit),
        },
        sorting: {
          sortBy: sortKey,
          availableSorts: Object.keys(sortOptions),
        },
        filters: {
          availableNow: params.availableNow || false,
          consultationType: params.consultationType || null,
          minPrice: params.minPrice || null,
          maxPrice: params.maxPrice || null,
          expertise: params.expertise || null,
          minRating: params.minRating || null,
          language: params.language || null,
        },
      },
    };
  } catch (error) {
    console.error("Error in getTopExperts:", error);
    throw new Error("Failed to retrieve experts: " + error.message);
  }
};

/**
 * @method getExpertById
 * Fetches complete details for a single expert
 * @param {string} expertId - ID of the expert to retrieve
 * @returns {Promise<Object>} - Complete expert data
 */
export const getExpertById = async (expertId) => {
  try {
    const expert = await UserModel.findOne({
      _id: expertId,
      status: "ACTIVE",
      expertEnrolledAt: { $ne: null },
    })
      .populate([
        { path: "profile" },
        {
          path: "profileExpertise",
          populate: { path: "expertises.expertise" },
        },
        { path: "profileExpertRate" },
        { path: "profileEducation" },
        { path: "profileExperience" },
        { path: "profileAchievement" },
        { path: "spokenLanguages" },
        {
          path: "profileExpertService",
          populate: [{ path: "serviceGroup" }, { path: "services" }],
        },
      ])
      .lean();

    if (!expert) {
      throw new Error("Expert not found");
    }

    // Return full data for individual expert view
    return expert;
  } catch (error) {
    console.error("Error in getExpertById:", error);
    throw new Error("Failed to retrieve expert: " + error.message);
  }
};

/**
 * @method getExpertsByFilter
 * Searches experts based on multiple criteria
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} - Filtered experts with pagination
 */
export const getExpertsByFilter = async (filters = {}) => {
  // This is a more specialized version you can implement
  // based on specific filter requirements
  return getTopExperts(filters);
};

const ExpertAction = {
  showProfessionalProfile,
  getTopExperts,
  getTopExpertsList,
};
export default ExpertAction;
