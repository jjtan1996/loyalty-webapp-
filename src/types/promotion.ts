export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  points_required: number | null;
  start_date: string;
  end_date: string;
  active: boolean;
};