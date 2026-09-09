export interface OverdueItem {
  id: string;
  title: string;
  scheduled_time?: string;
  target_date?: string;
  formatted_datetime?: string;
  status: string;
  status_label?: string;
  status_color?: string;
  target_platform?: string[] | string;
  assignee_names?: string;
  editor_names?: string;
}

export interface OverdueChannelGroup {
  channel_id: string;
  channel_name: string;
  channel_color: string;
  channel_logo?: string;
  items: OverdueItem[];
}
