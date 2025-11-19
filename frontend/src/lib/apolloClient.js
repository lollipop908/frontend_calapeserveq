import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";


const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";


const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
  credentials: "include", 
});


const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  const nextHeaders = { ...headers };
  if (token) {
    nextHeaders.authorization = `Bearer ${token}`;
  } else if (nextHeaders.authorization) {
    delete nextHeaders.authorization;
  }
  return { headers: nextHeaders };
});


export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});