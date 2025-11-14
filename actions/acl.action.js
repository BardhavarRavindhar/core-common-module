/**
 * @module AclAction
 * 
 * This module defines methods to handle role related actions
 */
import RoleModel from "../models/role.model.js";
import { getRoleMeta } from "../enums/role.enum.js";

/**
 * @method  getRoles
 * Get roles based on provided parameters.
 * @param {object} params - The query parameters for filtering roles.
 * @returns {Promise<object[]>} - The collection of roles.
 */
export const getRoles = async (params) => {
  // Build filter query based on query params
  const filterQuery = await RoleModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await RoleModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
};

/**
 * @method  getAssignRoleByName
 * Get a role by its name if it is enabled.
 * @param {string} roleName - The name of the role.
 */
export const getAssignRoleByName = async (roleName) => {
  const Role = await RoleModel.findOne({ name: roleName, enabled: true }).exec();
  return Role;
}

/**
 * Create a new role.
 * @param {object} payload - The data for the new role.
 * @param {object} roleMeta - The data for the new role to define private properties
 */
export const createRole = async (payload) => {
  const { name } = payload;
  const roleMeta = await getRoleMeta(name);
  roleMeta["name"] = name;
  const modelSchema = await RoleModel.enforceOnlyFillables(payload, roleMeta);
  const record = await RoleModel.create(modelSchema);
  return record;
};

// Export the AclAction as collection of methods as class methods
const AclAction = {
  getRoles,
  getAssignRoleByName,
  createRole
}

export default AclAction;