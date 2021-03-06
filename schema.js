export default `

  type Subscription {
    userAdded: User!
  }

  type Suggestion {
    id: Int!
    text: String!
    creator: User!
  }

  type Board {
    id: Int!
    name: String!
    suggestions: [Suggestion!]!
    owner: Int!
  }

  type User {
    id: Int!
    username: String
    createdAt: String!
    updatedAt: String! 
    boards: [Board!]!
    suggestions: [Suggestion!]!
    isAdmin: Boolean!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
  }

  type Author {
    id: Int!
    firstname: String!
    lastname: String!
    primary: Boolean
    books: [Book!]!
  }

  type Book {
    id: Int!
    title: String!
    authors: [Author!]!
  }

  type Champion {
    id: Int!
    name: String!
    publicId: String!
  }

  type Student {
    testScore1: Int!
    testScore2: Int!
    testScore3: Int!
  }

  type Error {
    path: String!
    message: String!
  }

  type RegisterResponse {
    ok: Boolean!
    errors: [Error!]
    user: User
  }

  type Query {
    searchBooks(title: String!): [Book!]!
    getChampion(id: Int!): Champion
    getBook(id: Int!): Book
    allBooks(key: Int!, limit: Int!): [Book!]!
    allAuthors: [Author!]!
    allUsers: [User!]!
    me: User
    userBoards(owner: Int!): [Board!]!
    userSuggestions(creatorId: String!): [Suggestion!]!
    suggestions: [Suggestion!]!
    someSuggestions(limit: Int!, offset: Int!): [Suggestion!]!
    someSuggestions2(limit: Int!, cursor: Int): [Suggestion!]!
    searchSuggestions(query: String!, limit: Int!, cursor: Int): [Suggestion!]!
  }

  type Mutation {
    createStudent(testScore1: Int!, testScore2: Int!, testScore3: Int!): Student!
    createChampion(name: String!, publicId: String!): Champion!
    forgetPassword(userId: Int!, newPassword: String!): Boolean!
    createAuthor(firstname: String!, lastname: String!): Author!
    createBook(title: String!): Book!
    addBookAuthor(bookId: Int!, authorId: Int!, primary: Boolean!): Boolean!
    updateUser(username: String!, newUsername: String!): [Int!]!
    deleteUser(username: String!): Int!
    createBoard(owner: Int!, name: String): Board!
    createSuggestion(creatorId: Int!, text: String, boardId: Int!): Suggestion!
    register(username: String!, email: String!, password: String!, isAdmin: Boolean): RegisterResponse!
    login(email: String!, password: String!): AuthPayload!
    createUser(username: String!): User!
    refreshTokens(token: String!, refreshToken: String!): AuthPayload!
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;
