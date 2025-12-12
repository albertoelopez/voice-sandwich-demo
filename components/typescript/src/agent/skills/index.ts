/**
 * Central export for all agent skills
 *
 * This module aggregates all skills from order management and menu information
 * and exports them as a unified collection for the agent to use.
 */

// Re-export all individual tools
export * from "./order";
export * from "./menu";

// Import skill arrays
import { orderSkills } from "./order";
import { menuSkills } from "./menu";

/**
 * Combined array of all available skills for the voice sandwich shop assistant
 *
 * Order Skills (5):
 * - add_to_order: Add items to customer's order
 * - remove_from_order: Remove items from order
 * - confirm_order: Confirm and finalize the order
 * - cancel_order: Cancel the current order
 * - get_order_status: Check what's currently in the order
 *
 * Menu Skills (4):
 * - get_menu_info: Get information about menu categories
 * - check_availability: Check if specific items are available
 * - get_sandwich_details: Get detailed info about specialty sandwiches
 * - get_dietary_info: Get information about dietary accommodations
 */
export const allSkills = [...orderSkills, ...menuSkills];
