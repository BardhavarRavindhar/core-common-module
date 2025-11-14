import mongoose from "mongoose";
import { initDB, quitDB } from "../../bootstrap/database.js";
import { createCountry, createCurrency, createExpertise, createInterest, createLanguage, createProvince  ,createSocial , createService} from "../../actions/platform.action.js";
import { createRole } from "../../actions/acl.action.js";
import country from "./country.seeder.js";
import currency from "./currency.seeder.js";
import expertise from "./expertise.seeder.js";
import interest from "./interest.seeder.js";
import language from "./language.seeder.js";
import province from "./province.seeder.js";
import social from "./social.seeder.js";
import services from "./service.seeder.js";
import role from "./role.seeder.js";

const insertSeedData = async () => {
  try {
    // Initialize the database connection
    await initDB();

    // // Insert countries
    // for (const item of country) {
    //   await createCountry(item);
    //   console.log(`Inserted country: ${item.name}`);
    // }

    // // Insert currencies
    // for (const item of currency) {
    //   await createCurrency(item);
    //   console.log(`Inserted currency: ${item.name}`);
    // }

    // Insert expertise
    for (const item of expertise) {
      await createExpertise(item);
      console.log(`Inserted expertise: ${item.name}`);
    }

    // Insert interests
    // for (const item of interest) {
    //   try {
    //     await createInterest(item);
    //     console.log(`Inserted interest: ${item.name}`);
    //   } catch (error) {
    //     if (error.code === 11000) {
    //       console.log(`Duplicate interest found: ${item.name}, skipping...`);
    //     } else {
    //       throw error;
    //     }
    //   }
    // }

    // // Insert languages
    // for (const item of language) {
    //   await createLanguage(item);
    //   console.log(`Inserted language: ${item.name}`);
    // }

    // // Insert provinces
    // for (const item of province) {
    //   await createProvince(item);
    //   console.log(`Inserted province: ${item.name}`);
    // }

    // // Insert roles
    // for (const item of role) {
    //   await createRole(item);
    //   console.log(`Inserted role: ${item.name}`);
    // }

    // Insert social media platforms
    // for (const item of social) {
    //   await createSocial(item);
    //   console.log(`Inserted social media platform: ${item.name}`);
    // }

    // Insert services

    // const allServices = [
    //   ...services.servicelevel1,
    //   ...services.servicelevel2,
    //   ...services.servicelevel3
    // ];

    //    const validateServiceItem = (item) => {
    //   const requiredFields = ['name', 'code']; // Add all required fields here
    //   for (const field of requiredFields) {
    //     if (!item[field]) {
    //       throw new Error(`Missing required field: ${field} in service item: ${JSON.stringify(item)}`);
    //     }
    //   }
    // };
    
    // for (const item of allServices) {
    //   try {
    //     validateServiceItem(item); // Validate the service item
    //     await createService(item);
    //     console.log(`Inserted service: ${item.name}`);
    //   } catch (error) {
    //     if (error.code === 11000) {
    //       console.log(`Duplicate service found: ${item.name}, skipping...`);
    //     } else {
    //       console.error(`Error inserting service: ${item.name}`);
    //       throw error;
    //     }
    //   }
    // }

    console.log("All seed data has been inserted successfully.");
  } catch (error) {
    console.log(`Error inserting seed data: ${error.message}`);
    console.error(error.stack);

    console.error(`Error inserting seed data: ${error.message}`);
    console.error(error.stack);
    
  } finally {
    // Close the database connection
    await quitDB();
  }
};

// Run the script
insertSeedData();