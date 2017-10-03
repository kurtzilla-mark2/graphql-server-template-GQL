import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { graphiqlExpress, graphqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import joinMonsterAdapt from 'join-monster-graphql-tools-adapter';
import passport from 'passport';
import FacebookStrategy from 'passport-facebook';

import typeDefs from './schema';
import resolvers from './resolvers';
import models from './models';
import { createTokens, refreshTokens } from './auth';
import joinMonsterMetadata from './joinMonsterMetadata';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

joinMonsterAdapt(schema, joinMonsterMetadata);

const SECRET = process.env.SERVER_SECRET;
const app = express();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_LOGIN_APP_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_LOGIN_APP_SECRET,
      callbackURL: `${process.env.SERVER_HOST}:${process.env
        .SERVER_PORT}/auth/facebook/callback`,
      scope: ['email'],
      profileFields: ['id', 'emails']
    },
    async (accessToken, refreshToken, profile, cb) => {
      // 2 cases
      // #1 first time login
      // #2 previously logged in with facebook
      // #3 previously registered with email
      const { id, emails: [{ value }] } = profile;
      // []
      let fbUser = await models.User.findOne({
        where: { $or: [{ fbId: id }, { email: value }] }
      });

      console.log(fbUser);
      console.log(profile);

      if (!fbUser) {
        // case #1
        fbUser = await models.User.create({
          fbId: id,
          email: value
        });
      } else if (!fbUser.fbId) {
        // case #3
        // add email to user
        await fbUser.update({
          fbId: id
        });
      }

      cb(null, fbUser);
    }
  )
);

app.use(passport.initialize());

app.get('/flogin', passport.authenticate('facebook'));

app.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    const [token, refreshToken] = await createTokens(
      req.user,
      SECRET,
      req.user.refreshSecret
    );
    res.redirect(
      `${process.env.CLIENT_HOST}:${process.env
        .CLIENT_PORT}/home?token=${token}&refreshToken=${refreshToken}`
    );
  }
);

const addUser = async (req, res, next) => {
  const token = req.headers['x-token'];
  if (token) {
    try {
      const { user } = jwt.verify(token, SECRET);
      req.user = user;
    } catch (err) {
      const refreshToken = req.headers['x-refresh-token'];
      const newTokens = await refreshTokens(
        token,
        refreshToken,
        models,
        SECRET
      );
      if (newTokens.token && newTokens.refreshToken) {
        res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
        res.set('x-token', newTokens.token);
        res.set('x-refresh-token', newTokens.refreshToken);
      }
      req.user = newTokens.user;
    }
  }
  next();
};

app.use(cors('*'));
app.use(addUser);

app.use(
  '/graphiql',
  graphiqlExpress({
    endpointURL: '/graphql'
  })
);

app.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(req => ({
    schema,
    context: {
      models,
      SECRET,
      user: req.user
    }
  }))
);

if (process.env.NODE_ENV !== 'development') {
  // this declaration must follow the graph(i)ql endpoints
  // first call will load each known route - second is catchall
  app.use(express.static('public'));
  app.use('*', express.static('public'));
}

const server = createServer(app);

models.sequelize.sync({ force: true }).then(() =>
  server.listen(process.env.SERVER_PORT, () => {
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema
        // add permissions?
        // http://dev.apollodata.com/tools/graphql-subscriptions/authentication.html
        //   onConnect: (connectionParams, webSocket) => {
        //     if (connectionParams.authToken) {
        //          return validateToken(connectionParams.authToken)
        //              .then(findUser(connectionParams.authToken))
        //              .then((user) => {
        //                  return {
        //                      currentUser: user,
        //                  };
        //              });
        //     }
        //     throw new Error('Missing auth token!');
        //  }
      },
      {
        server,
        path: '/subscriptions'
      }
    );
  })
);
