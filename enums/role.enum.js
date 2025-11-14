/**
 * @module Role
 * 
 * This module defines the Role's constants that provide private payload for each role.
 */

import ApiError from "../exceptions/api.error.js";

/**
 * Private Role Data
 * @readonly
 */
export const Roles = Object.freeze({
  SUPER: {
    priority: 0,
    forSystem: true,
    enforceAbility: 0
  },
  ADMIN: {
    priority: 1,
    forSystem: true,
    enforceAbility: 1
  },
  AUTHOR: {
    priority: 2,
    forSystem: true,
    enforceAbility: 1
  },
  USER: {
    priority: 99,
    forSystem: false,
    enforceAbility: 1
  }
});

/**
 * @method getAllRoles
 * Get all roles in the system
 * @returns {string[]} List of role names
 */
export const getAllRoles = () => Object.keys(Roles);

/**
 * @method getAssignRoles
 * Get all assignable roles (excluding SUPER)
 * @returns {string[]} List of assignable roles
 */
export const getAssignRoles = () => Object.keys(RolePayload).filter((role) => role !== "SUPER");

/**
 * @method getRoleMeta
 * Get properties assigned to a specific role
 * @param {string} roleName - Role name to fetch properties
 * @returns {Object} Role private properties
 */
export const getRoleMeta = (roleName) => {
  if (!Object.prototype.hasOwnProperty.call(Roles, roleName)) {
    throw new ApiError({ message: "Unknown role name provided.", errors: { roleName }, forClient: false });
  }
  return Roles[roleName];
};
