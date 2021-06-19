import React from "react";
import Todo from "./Todo";

export const TodoList = ({ todos, apiUrl }) => {
  return (
    <ul className="todoList">
      {todos
        ?.sort((a, b) => a.created - b.created)
        ?.map((todo, i) => (
          <Todo key={i} todo={todo} apiUrl={apiUrl} />
        ))}
    </ul>
  );
};
