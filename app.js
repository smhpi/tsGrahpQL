const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();

//const events = [];
/*
app.get("/", (req, res, next) => {
  res.send("<h3>Hello GraphQL!</h3>");
});
*/

app.use(
  "/graphql",
  graphqlHttp({
    schema: buildSchema(`
        type Event{
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
          _id: ID!
          email: String!
          password: String
        }

        input EventInput{
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput{
          email: String!
          password: String!
        }

        type RootQuery{
            events: [Event!]!
        }

        type RootMutation{
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema{
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      events: () => {
        //    return ["Romantic", "Sailin", "AllSeason"];
        //return events;
        return Event.find()
          .then(events => {
            return events.map(event => {
              return { ...event._doc, _id: event.id };
            });
          })
          .catch(err => {
            throw err;
          });
      },
      createEvent: args => {
        //  const eventName = args.name;
        //  return eventName;
        /*
        const event = {
          _id: Math.random().toString(),
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          // date: new Date().toISOString()
          date: args.eventInput.date
        };
        events.push(event);
        return event;
        */
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: "5c800cd600a1f62414818e95"
        });
        let createdEvent;
        return event
          .save()
          .then(result => {
            createdEvent = { ...result._doc, _id: event.id.toString() };
            return User.findById("5c800cd600a1f62414818e95");
          })
          .then(user => {
            if (!user) {
              throw new Error("User not Found");
            }
            user.createdEvents.push(event);
            return user.save();
          })
          .then(result => {
            return createdEvent;
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      },
      createUser: args => {
        return User.findOne({ email: args.userInput.email })
          .then(user => {
            if (user) {
              throw new Error("User exist already");
            }
            return bcrypt.hash(args.userInput.password, 12);
          })
          .then(hashedPassword => {
            const user = (r = new User({
              email: args.userInput.email,
              password: hashedPassword
            }));
            return user.save();
          })
          .then(result => {
            return {
              ...result._doc,
              password: null,
              _id: result.id.toString()
            };
          })
          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);
app.use(bodyParser.json());

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${
      process.env.MONGO_PASSWORD
    }@cluster0-l6w8m.gcp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`
  )
  .then(() => {
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });
