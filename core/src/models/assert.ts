import {
  DesignInfo,
  DesignTypes,
  ColorTypes,
  AuthorInfo,
  designIdPattern,
  authorIdPattern,
  Platforms,
  Contributor,
} from "./types";
import {
  assertIsDefined,
  assertIsString,
  assertIsArray,
  assertIncludes,
  assertRegex,
  assertIsBoolean,
} from "../utilities/assert";

export function assertIsDesignInfo(val?: DesignInfo): asserts val is DesignInfo {
  assertIsDefined(val);
  assertIsString<DesignInfo>(val.title, "title");
  assertRegex<DesignInfo>(val.designId, "designId", designIdPattern);
  assertIsArray<DesignInfo>(val.dominantColorTypes, "dominantColorTypes");
  for (const type of val.dominantColorTypes) {
    assertIncludes<DesignInfo>(type, "dominantColorTypes", ColorTypes);
  }
  assertIsArray<DesignInfo>(val.dominantColors, "dominantColors");
  for (const color of val.dominantColors) {
    assertRegex<DesignInfo>(color, "dominantColors", /^[0-9A-F]{6}$/);
  }
  assertIncludes<DesignInfo>(val.designType, "designType", DesignTypes);

  const author = val.author;
  if (author) {
    assertIsString<AuthorInfo>(author.authorName, "authorName");
    assertRegex<AuthorInfo>(author.authorId, "authorId", authorIdPattern);
    assertRegex<AuthorInfo>(author.islandName, "islandName", /島$/);
  }

  const imageUrls = val.imageUrls;
  assertIsDefined(imageUrls);
  assertRegex(imageUrls.large, "large", /^http(s):\/\//);
  assertRegex(imageUrls.thumb1, "thumb1", /^http(s):\/\//);
  assertRegex(imageUrls.thumb2, "thumb2", /^http(s):\/\//);

  const post = val.post;
  assertIsDefined(post);
  assertIsString(post.postId, "postId");
  assertIsBoolean(post.fromSwitch, "fromSwitch");
  assertIncludes(post.platform, "postId", Platforms);
  assertIsDefined(val.createdAt);
}

export function assertIsContributor(val: unknown): asserts val is Contributor {
  assertIsDefined(val);
  const con = val as Contributor;
  assertIsString<Contributor>(con.id, "id");
  assertIncludes<Contributor>(con.platform, "platform", Platforms);
}
