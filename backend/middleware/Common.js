import CustomError from "../config/errors/CustomError.js";


export const verifyrequiredparams = ( body, fields) => {
    try {
      let error = false;
      let error_fields = "";
      if (body.length < 1) {
        return new CustomError('Body is Missing',404)
      }
      const element = Object.getOwnPropertyNames(body);
      for (const field of fields) {
        if (element.some((e) => e == field)) {
          if (Object.keys(body[field]).length === 0) {
            if (typeof body[field] == "number") {
              continue;
            } else {
              error = true;
              error_fields += field + ", ";
            }
          }
          continue;
        } else {
          error = true;
          error_fields += field + ", ";
        }
      }
      if (error) {
        throw new CustomError(
            `Required fields : ${error_fields.slice(0, -2)} is missing`,
            404
          );
      } else {
        return Promise.resolve();
      }
    } catch (error) {
      throw new CustomError(error.message,404)
    }
  };

  



