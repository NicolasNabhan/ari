import { Workspace } from "@/components/workspace/Workspace";
import { StoryStage } from "@/components/story/StoryStage";
import { MariaStage } from "@/components/story/MariaStage";
import { PetStage } from "@/components/story/pet/PetStage";

export default function StoryPage() {
  return (
    <StoryStage>
      <Workspace audience="expert" story>
        <MariaStage />
        <PetStage />
      </Workspace>
    </StoryStage>
  );
}
