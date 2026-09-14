export type CardProps = {
  title: string;
  description?: string;
};

export function SimpleCard({ title, description }: CardProps) {
  return {
    title,
    description,
  };
}
