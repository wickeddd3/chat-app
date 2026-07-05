import { HttpException, NotFoundException, BadRequestException } from "@/utils/http.exception";

describe("HttpException", () => {
  it("carries statusCode, message, and default null details", () => {
    const err = new HttpException(418, "I'm a teapot");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I'm a teapot");
    expect(err.details).toBeNull();
  });

  it("preserves the underlying cause when provided", () => {
    const underlying = new Error("db exploded");
    const err = new HttpException(500, "Failed to create user.", null, { cause: underlying });
    expect(err.cause).toBe(underlying);
  });

  it("carries structured details (e.g. zod issues)", () => {
    const details = [{ field: "email", message: "Invalid email" }];
    const err = new HttpException(400, "Validation Failed", details);
    expect(err.details).toEqual(details);
  });

  it("NotFoundException defaults to 404", () => {
    const err = new NotFoundException();
    expect(err).toBeInstanceOf(HttpException);
    expect(err.statusCode).toBe(404);
  });

  it("BadRequestException defaults to 400 and accepts details", () => {
    const err = new BadRequestException("bad", [{ field: "x", message: "y" }]);
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual([{ field: "x", message: "y" }]);
  });
});
