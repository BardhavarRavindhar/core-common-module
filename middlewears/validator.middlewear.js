/** 
  * @module apiValidator Middlewear
  *
  * Middlewear to validate request inputs for process further
  */
import { Validator } from "../utils/validator.util.js";
import catchAsync from "../utils/catch-async.util.js";
import ValidatorError from "../exceptions/validator.error.js";

const apiValidator = ({ ruleSchema, forQuery = false, code = "UNPROCESSABLE_ENTITY" }) => {
  return catchAsync(async (req, res, next) => {
    const payload = forQuery == true ? req.query : req.body;
    const errors = Validator(ruleSchema, payload);
    if (errors) {
      throw new ValidatorError({ errors: errors, code: code });
    } else {
      next();
    }
  });
}

export default apiValidator;