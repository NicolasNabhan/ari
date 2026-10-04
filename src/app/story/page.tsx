import { Workspace } from "@/components/workspace/Workspace";
import { StoryStage } from "@/components/story/StoryStage";
import { StoryPlayer } from "@/components/story/StoryPlayer";

export default function StoryPage() {
  return (
    <StoryStage>
      <Workspace audience="expert" story>
        <StoryPlayer />
      </Workspace>
    </StoryStage>
  );
}
