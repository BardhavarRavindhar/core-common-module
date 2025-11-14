/**
 * @module ProfileProgressUtil
 *
 * This module calculates profile completion progress based on required fields
 */

/**
 * Calculates the profile completion score based on required profile fields
 * @param {Object} profile - The profile document
 * @param {Object} user - The user document
 * @returns {number} - Profile completion percentage (0-100)
 */
const calculateProfileProgress = (profile, user) => {
  if (!profile || !user) return 0;

  // Define required fields and their weights (total 100%)
  const requiredFields = {
    // Profile fields (40%)
    profile: {
      name: 10,
      dateOfBirth: 10,
      city: 10,
      gender: 10,
    },
    // User fields (60%)
    user: {
      displayName: 10,
      photo: 10,
      languages: 10,
      location: 10,
      provinceCode: 10,
      countryCode: 10,
    },
  };

  let score = 0;

  // Check profile fields
  Object.entries(requiredFields.profile).forEach(([field, weight]) => {
    const value = profile[field];
    const isValid = !!value;

    if (isValid) {
      score += weight;
    }
  });

  // Check user fields
  Object.entries(requiredFields.user).forEach(([field, weight]) => {
    let isValid = false;
    let value = user[field];

    switch (field) {
      case "languages":
        isValid = Array.isArray(user.languages) && user.languages.length > 0;

        break;

      case "location":
        isValid =
          user.location?.coordinates?.length === 2 &&
          user.location.coordinates.every(
            (coord) => typeof coord === "number"
          ) &&
          user.location.coordinates.some((coord) => coord !== 0);

        break;

      case "photo":
        isValid = !!user.photo;

        break;

      default:
        isValid = !!value;
    }

    if (isValid) {
      score += weight;
    }
  });

  return score;
};

// const updateProfileProgress = async (profile, user) => {
//   if (!profile || !user) {
//     throw new Error("Profile and user objects are required");
//   }

//   const score = calculateProfileProgress(profile, user);

//   return score;
//   // Update profile with new score
//   // const updatedProfile = await ProfileModel.findByIdAndUpdate(
//   //   profile._id,
//   //   {
//   //     profileProgressScore: score,
//   //     isCompleted: score === 100,
//   //   },
//   //   { new: true }
//   // );

//   return updatedProfile;
// };

export { calculateProfileProgress };
