
import { default as config } from "./configs/api.config.js";
import { default as logger } from "./utils/logger.util.js";


//Middlewares 
import jsonGuard from "./middlewears/jsonguard.middlewear.js";
import apiResponse from "./middlewears/response.middlewear.js";
import routeGuard from "./middlewears/routeguard.middlewear.js";
import headerLimit from "./middlewears/header-limit.middlewear.js";
import methodGuard from "./middlewears/methodguard.middlewear.js";
import uriLimit from "./middlewears/uri-limit.middlewear.js";
import errorResponder from "./middlewears/error-responder.middlewear.js";
import authenticate from './middlewears/authenticate.middlewear.js';

import { getHttpAllowedMethods } from "./enums/httpcore.enum.js";

import { initDB, quitDB } from "./bootstrap/database.js";
import { cacheClient, initCacheService, quitCacheService } from "./bootstrap/cache.js";
import apiValidator from "./middlewears/validator.middlewear.js";
import { BookingExpertStatus, BookingSessionType, BookingStatus, BookingType, BookingUser } from "./enums/booking.enum.js";
//import BookingAction from "./actions/booking.action.js";
import PlatformActions from "./actions/platform.action.js";

export const services = {
    //cache: require("./services/cache.service.js"),
    cache: {
        client: cacheClient,
        start: initCacheService,
        stop: quitCacheService
    },
    database: {
        start: initDB,
        stop: quitDB 
    }
}

// Enums 
export const enums = {
    httpCore: {
        getHttpAllowedMethods
    },
    booking: {
        BookingUser,
        BookingExpertStatus,
        BookingStatus,
        BookingType,
        BookingSessionType
    }
}
// Middlewars 
export const middlewares = {
    uriLimit,
    jsonGuard,
    apiResponse,
    apiValidator,
    routeGuard,
    headerLimit,
    methodGuard,
    errorResponder,
    authenticate
}

// Actions 
export const actions = {
    // booking: {
    //     ...BookingAction
    // },
    platform: {
        ...PlatformActions
    }
}



export { config, logger };
