import { TagProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";

type ITagDefinition = {
  key: string;
  value: string;
  props?: TagProps;
};

export class Tagger {
  static addTags(stack: Construct, tags: Array<ITagDefinition>): void {
    tags.forEach((tag) => {
      Tagger.tagResource(stack, tag);
    });
  }

  static tagResource(stack: Construct, tag: ITagDefinition): void {
    Tags.of(stack).add(tag.key, tag.value, tag.props);
  }
}
