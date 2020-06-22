const jwt = require('jsonwebtoken');
const { extractTokenFromRequest } = require('rfc6750');

module.exports = jwtMiddleware;

function validatePermissions(decodedToken, permissions) {
  let notFoundPermissions = [];
  if (permissions && Array.isArray(permissions)) {
    if (
      !decodedToken.permissions
      || !decodedToken.permissions.length 
      || !Array.isArray(decodedToken.permissions)
    ) {
      // token doesn't have permissions
      notFoundPermissions = permissions;
    } else {
      notFoundPermissions = permissions
        .filter(permission => !decodedToken.permissions.includes(permission));
    }
  }
  return notFoundPermissions;
}

function validateExpiration(decodedToken) {
  let valid = !decodedToken || !decodedToken.exp;
  if (decodedToken && decodedToken.exp && (decodedToken.exp * 1000) > Date.now()) {
    valid = true;
  }
  return valid;
}

function validateToken(context, key, jwtOptions, continueOnError, STOP_SIGNAL, {
  permissions,
} = {}) {
  const token = extractTokenFromRequest(context.req, {
    authorizationHeaderKey: 'authorization', // redefining to match Azure's capitalization
    cookieHeaderKey: 'cookie', // redefining to match Azure's capitalization
  });
  const res = context.res;

  if (!token) {
    res.status = 401;
    res.headers['WWW-Authenticate'] = 'Bearer';
  } else {
    try {

      context.accessTokenDecoded = jwt.verify(token, key, jwtOptions);
      context.accessToken = token;

      if (!validateExpiration(context.accessTokenDecoded)) {
        throw new Error('expired token');
      }

      const _permissions = validatePermissions(context.accessTokenDecoded, permissions);
      if (_permissions.length) {
        res.status = 403;
        const error = `required permissions array: [${_permissions.join(',')}]`;
        res.headers['WWW-Authenticate'] = `Bearer,error="insufficient_scope",error_description=${error}`;
      }

    } catch (error) {
      res.status = 401;
      let _err = error;
      if (error instanceof Error) {
        _err = error.toString();
      } else {
        _err = JSON.stringify(error);
      }
      res.headers['WWW-Authenticate'] = `Bearer,error="invalid_token",error_description=${_err}`;
    }
  }


  if (!continueOnError && res.status && res.status > 399) {
    return STOP_SIGNAL;
  }
}


// https://tools.ietf.org/html/rfc6750#section-3.1 -> error messaging
// https://tools.ietf.org/html/rfc6750#section-2 -> bearer authentication methods
// https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback -> error descriptions

/**
 * Returns an Azure Functions Middleware for validating requests if JWT Authorization.
 * @param {Object} config { key, jwtOptions, continueOnError }
 * @param {String|Buffer} config.key The secret to use when vaidating JWT
 * @param {Object} [config.jwtOptions] Options to pass to JWT validation
 * @param {Boolean} [config.continueOnError=false] Specifies if middleware cascade should run even if JWT is invalid
 * @returns {AsyncFunction} Middleware
 *
 * @example
 * const jwtOptions = { algorithms: ['RS256'] };
 * const key = 'SECRET';
 * app.use(jwtMiddleware({ key, jtwOptions }));
 *
 * @see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback for JWT options, key algorithms and error descriptions
 * @see https://tools.ietf.org/html/rfc6750#section-2 for supported authentication methods
 */
function jwtMiddleware({ key, jwtOptions, continueOnError, permissions }) {
  return async (context, STOP_SIGNAL) => {
    try {
      return validateToken(context, key, jwtOptions, continueOnError, STOP_SIGNAL, {
        permissions,
      });
    } catch (error) {
      return error;
    }
  }
}
