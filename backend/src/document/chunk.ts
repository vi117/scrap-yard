import { ChunkContent, CommonChunkBase, IChunk } from "./doc.ts";

/**
 * common text chunk class
 * @param type the type of the chunk
 * @param content the content of the chunk
 */
export class CommonTextChunk extends CommonChunkBase {
  content: string;
  constructor(type: string, content: string) {
    super(type);
    this.content = content;
  }
  getContent(): ChunkContent {
    return {
      type: this.type,
      content: this.content,
    };
  }
}

export interface CreateChunkArgs {
  type: string;
}

const CommonTextChunkCreator = (args: {
  type: string;
  content?: string;
}) => {
  const content = args.content;
  if (content !== undefined) {
    return new CommonTextChunk(args.type, content);
  }
  throw new Error("Missing content");
};
type CommonTextChunkCreatorArgs = CreateChunkArgs & {
  content?: string;
};

/**
 * A chunk creator which creates a chunk with the given type and data.
 */
const ChunkCreatorsMap: Record<
  string,
  <T extends CreateChunkArgs>(args: T) => IChunk
> = {
  "text": (args: CommonTextChunkCreatorArgs) => CommonTextChunkCreator(args),
  "markdown": (args: CommonTextChunkCreatorArgs) =>
    CommonTextChunkCreator(args),
};

/**
 * Create a chunk with the given type and data.
 * @param args the arguments for creating the chunk
 * @returns the created chunk
 * @throws if the chunk type is not supported
 * @throws if the content is missing
 */
export function createChunk<T extends CreateChunkArgs>(args: T): IChunk {
  const creator = ChunkCreatorsMap[args.type];
  if (creator) {
    return creator(args);
  }
  throw new Error("Unknown chunk type");
}
