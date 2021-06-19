import React from "react";
import { UseInputState as useInputState } from "../hooks/useInputState";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { request, gql } from "graphql-request";
import { graphqlUrl } from "../api";

export const EditTodoForm = ({ todo, toggle, apiUrl }) => {
  const [value, handleChange, reset] = useInputState(todo.task);
  const queryClient = useQueryClient();

  const editTask = async (newTodo) => {
    if (apiUrl === graphqlUrl) {
      const {
        update: { body },
      } = await request(
        apiUrl,
        gql`
        mutation{
          update(id: "${todo.id}", task: "${newTodo.task}", completed: ${todo.completed}){
            statusCode,
            body
          }
        }
        `
      );
      return body;
    } else {
      return axios.put(`${apiUrl}/${todo.id}`, {
        task: newTodo.task,
        completed: todo.completed,
      });
    }
  };

  const { mutate } = useMutation((newTodo) => editTask(newTodo), {
    onMutate: (newTask) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      queryClient.cancelQueries(["tasks", apiUrl]);

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", apiUrl]);

      // Optimistically update to the new value
      queryClient.setQueryData(["tasks", apiUrl], (oldTasks) =>
        oldTasks.map((item) =>
          item.id === todo.id ? { ...item, task: newTask.task } : item
        )
      );

      // Return a context with the previous and new todo
      return { previousTasks };
    },
    // If the mutation fails, use the context we returned above
    onError: (err, newTask, context) => {
      queryClient.setQueryData(["tasks", apiUrl], context.previousTasks);
    },
    // Always refetch after error or success:
    onSettled: (newTask) => {
      queryClient.invalidateQueries(["tasks", apiUrl]);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate({ task: value });
        reset();
        toggle(false);
      }}
    >
      <input
        type="text"
        autoFocus
        className="edit"
        onChange={handleChange}
        value={value}
      />
    </form>
  );
};

export default EditTodoForm;
