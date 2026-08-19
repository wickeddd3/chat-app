import { formatBytes, validateImageFile, MAX_IMAGE_BYTES } from "./upload";

/** A File of a given type and size, without allocating the bytes. */
function fakeFile(type: string, size: number, name = "photo.jpg"): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImageFile", () => {
  it("accepts the supported formats", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(validateImageFile(fakeFile(type, 1024))).toBeNull();
    }
  });

  it("rejects a non-image, naming what is allowed", () => {
    const error = validateImageFile(fakeFile("application/pdf", 1024));

    expect(error).toMatch(/JPG, PNG, WebP or GIF/);
  });

  it("rejects an image format the canvas cannot re-encode", () => {
    // HEIC comes off iPhones and decodes in no browser we target.
    expect(validateImageFile(fakeFile("image/heic", 1024))).not.toBeNull();
  });

  it("rejects an oversized file and says how big it actually is", () => {
    const error = validateImageFile(fakeFile("image/png", 12 * 1024 * 1024));

    expect(error).toMatch(/12\.0 MB/);
    expect(error).toMatch(/5\.0 MB/);
  });

  it("accepts a file exactly on the limit", () => {
    expect(
      validateImageFile(fakeFile("image/png", MAX_IMAGE_BYTES)),
    ).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(validateImageFile(fakeFile("image/png", 0))).toMatch(/empty/i);
  });
});

describe("formatBytes", () => {
  it("scales the unit to the size", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
