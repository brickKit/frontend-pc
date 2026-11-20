// Reading a contract's types: Answer<paths, "/api/purchase/requisitions", "get"> is the 200 JSON body;
// RequestBody<...> the JSON request body.
type Json<T> = T extends { content: { "application/json": infer B } } ? B : never;

export type Answer<P, Path extends keyof P, M extends keyof P[Path]> =
  P[Path][M] extends { responses: infer R } ? (R extends { 200: infer O } ? Json<O> : R extends { 201: infer C } ? Json<C> : never) : never;

export type RequestBody<P, Path extends keyof P, M extends keyof P[Path]> =
  P[Path][M] extends { requestBody?: infer B } ? Json<NonNullable<B>> : never;
