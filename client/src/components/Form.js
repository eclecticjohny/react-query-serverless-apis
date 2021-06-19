import React from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "react-query";
import { UseInputState as useInputState } from "../hooks/useInputState";
import { v4 as uuidv4 } from "uuid";
import { request, gql } from "graphql-request";
import { graphqlUrl } from "../api";

export const Form = ({ todos, apiUrl }) => {
  const [value, onChangeHandler, reset] = useInputState("");
  const queryClient = useQueryClient();

  const addTodo = async (values) => {
    if (apiUrl === graphqlUrl) {
      const {
        create: { body },
      } = await request(
        apiUrl,
        gql`
        mutation {
          create(id: "${uuidv4()}", task: "${values.task}"){
            statusCode,
            body
          }
        }
        `
      );
      return body;
    } else {
      return axios.post(apiUrl, { ...values, id: uuidv4() });
    }
  };

  const { mutate } = useMutation((values) => addTodo(values), {
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(["tasks", apiUrl]);

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", apiUrl]);

      // Optimistically update to the new value
      queryClient.setQueryData(["tasks", apiUrl], (old) => [...old, newTask]);

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTask, context) => {
      queryClient.setQueryData(["tasks", apiUrl], context.previousTasks);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(["tasks", apiUrl]);
    },
  });

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        mutate({ task: value });
        reset();
      }}
    >
      <input
        type="text"
        className="form__box"
        onChange={onChangeHandler}
        name="task"
        value={value}
        placeholder="Enter a task..."
        required
      />

      <button className="form__button">Add Task</button>
    </form>
  );
};
