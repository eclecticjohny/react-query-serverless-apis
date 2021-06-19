import React from "react";
import { useQuery } from "react-query";
import { Form } from "./Form";
import { TodoList } from "./TodoList";
import { RadioSelect } from "./RadioSelect";
import axios from "axios";
import { request, gql } from "graphql-request";
import { graphqlUrl } from "../api";

const TodoApp = () => {
  const [apiUrl, setApiUrl] = React.useState(
    "https://x14o0xfo7f.execute-api.us-east-1.amazonaws.com/dev/todos"
  );

  const fetchTodos = async () => {
    if (apiUrl === graphqlUrl) {
      const { todos } = await request(
        apiUrl,
        gql`
          query {
            todos {
              statusCode
              body
            }
          }
        `
      );
      return JSON.parse(todos.body);
    } else {
      const { data } = await axios.get(apiUrl);
      return data;
    }
  };

  const {
    data: todos,
    isLoading,
    error,
  } = useQuery({ queryKey: ["tasks", apiUrl], queryFn: fetchTodos });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error...{error.message}</div>;
  return (
    <div className="wrapper">
      <RadioSelect apiUrl={apiUrl} setApiUrl={setApiUrl} />
      <Form todos={todos} apiUrl={apiUrl} />
      <TodoList todos={todos} apiUrl={apiUrl} />
    </div>
  );
};

export default TodoApp;
