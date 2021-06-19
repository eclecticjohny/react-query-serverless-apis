const { ApolloServer, gql } = require("apollo-server-lambda");
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    todo(id: String): Response
    todos: Response
  }

  type Mutation {
    create(id: String, task: String): Response
    update(id: String, task: String, completed: Boolean): Response
    delete(id: String): Response
  }

  type Response {
    statusCode: Int
    body: Int
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    todo: async (parent, args) => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          id: args.id,
        },
      };

      try {
        const { Item } = await dynamoDb.get(params).promise();
        return {
          statusCode: 200,
          body: JSON.stringify(Item) || "",
        };
      } catch (error) {
        return {
          statusCode: 501,
          body: `Failed to retrieve todo ${params.Key.id}`,
        };
      }
    },
    todos: async (parent, args) => {
      const params = { TableName: process.env.DYNAMODB_TABLE };

      try {
        const { Items } = await dynamoDb.scan(params).promise();
        return {
          statusCode: 200,
          body: JSON.stringify(Items || []),
        };
      } catch (error) {
        return {
          statusCode: 501,
          body: "Failed to retrieve any todos",
        };
      }
    },
  },
  Mutation: {
    create: async (parent, args) => {
      const timestamp = new Date().getTime();
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: args.id,
          task: args.task,
          completed: false,
          created: timestamp,
          updated: timestamp,
        },
      };

      try {
        await dynamoDb.put(params).promise();
        return {
          statusCode: 200,
          body: `Created todo ${params.Item.id}!`,
        };
      } catch (error) {
        console.error(error);
        return {
          statusCode: 501,
          body: `Failed to create todo ${params.Item.id}`,
        };
      }
    },
    update: async (parent, args) => {
      const timestamp = new Date().getTime();
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          id: args.id,
        },
        ExpressionAttributeNames: {
          "#todo_task": "task",
        },
        ExpressionAttributeValues: {
          ":task": args.task,
          ":completed": args.completed,
          ":updated": timestamp,
        },
        UpdateExpression:
          "SET #todo_task = :task, completed = :completed, updated = :updated",
        ReturnValues: "ALL_NEW",
      };

      try {
        await dynamoDb.update(params).promise();
        return {
          statusCode: 200,
          body: `Updated todo ${params.Key.id}!`,
        };
      } catch (error) {
        console.error(error);
        return {
          statusCode: 501,
          body: `Failed to update todo ${params.Key.id}`,
        };
      }
    },
    delete: async (parent, args) => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          id: args.id,
        },
      };

      try {
        await dynamoDb.delete(params).promise();
        return {
          statusCode: 200,
          body: `Deleted todo ${params.Key.id}!`,
        };
      } catch (error) {
        console.error(error);
        return {
          statusCode: 501,
          body: `Failed to delete todo ${params.Key.id}`,
        };
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ event, context }) => ({
    headers: event.headers,
    functionName: context.functionName,
    event,
    context,
  }),
  playground: {
    endpoint: "/dev/graphql",
  },
});

exports.handler = server.createHandler({
  cors: {
    origin: "*",
    credentials: true,
  },
});
