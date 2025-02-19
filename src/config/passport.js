const passport = require( 'passport' );
const OAuth2Strategy = require( 'passport-oauth2' );

passport.use( new OAuth2Strategy( {
     authorizationURL: 'URL_DE_AUTORIZACION_DE_LA_OTRA_APP',
     tokenURL: 'URL_DE_TOKEN_DE_LA_OTRA_APP',
     clientID: 'TU_CLIENT_ID',
     clientSecret: 'TU_CLIENT_SECRET',
     callbackURL: "http://tu-app/auth/callback"
},
     function ( accessToken, refreshToken, profile, cb ) {
          // Aquí manejas el token y la información del usuario
          return cb( null, profile );
     }
) );

module.exports = passport;