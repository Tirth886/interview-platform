import { QaBankManager } from "./QaBankManager";

export const QaSection = ({
  canEdit,
  title,
  description,
}: {
  canEdit: boolean;
  title: string;
  description: string;
}): JSX.Element => (
  <QaBankManager canEdit={canEdit} title={title} description={description} />
);
