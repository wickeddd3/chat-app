import { Container, type ServiceIdentifier } from "inversify";

/**
 * Builds a throwaway InversifyJS container for unit tests: bind the collaborators
 * a service depends on as constant mocks, then bind the real service under test.
 *
 * @example
 *   const container = buildTestContainer([[TYPES.FooRepository, mockRepo]]);
 *   container.bind(TYPES.FooService).to(FooService);
 *   const service = container.get<FooService>(TYPES.FooService);
 */
export function buildTestContainer(mocks: [ServiceIdentifier, unknown][]): Container {
  const container = new Container();
  for (const [id, value] of mocks) {
    container.bind(id).toConstantValue(value);
  }
  return container;
}
