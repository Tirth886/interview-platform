import { AiAgentManager } from "./AiAgentManager";

type AiAgentSectionProps = {
  canEdit: boolean;
  title: string;
  description: string;
};

export const AiAgentSection = ({
  canEdit,
  title,
  description,
}: AiAgentSectionProps): JSX.Element => (
  <AiAgentManager canEdit={canEdit} title={title} description={description} />
);
