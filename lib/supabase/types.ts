export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BubbleRow = {
  id: string;
  slug: string;
  name: string;
  event_name: string;
  is_active: boolean;
  created_at: string;
};

export type VisitorRow = {
  id: string;
  bubble_id: string;
  session_id: string;
  nickname: string;
  avatar_url: string | null;
  is_guest: boolean;
  is_active: boolean;
  joined_at: string;
  last_seen_at: string;
  left_at: string | null;
  created_at: string;
};

export type PostRow = {
  id: string;
  bubble_id: string;
  visitor_id: string;
  content: string;
  created_at: string;
  visitors?: Pick<VisitorRow, "nickname" | "avatar_url"> | null;
};

export type PollRow = {
  id: string;
  bubble_id: string;
  question: string;
  options: Array<{ key: string; label: string }>;
  is_active: boolean;
  created_at: string;
};

export type PollVoteRow = {
  id: string;
  poll_id: string;
  visitor_id: string;
  option_key: string;
  created_at: string;
};

export type FanBattleRow = {
  id: string;
  bubble_id: string;
  home_team: string;
  away_team: string;
  home_taps: number;
  away_taps: number;
  is_active: boolean;
  created_at: string;
};

export type FanBattleEntryRow = {
  id: string;
  fan_battle_id: string;
  visitor_id: string;
  selected_team: "home" | "away";
  taps: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      bubbles: {
        Row: BubbleRow;
        Insert: Partial<BubbleRow> & Pick<BubbleRow, "slug" | "name" | "event_name">;
        Update: Partial<BubbleRow>;
      };
      visitors: {
        Row: VisitorRow;
        Insert: Partial<VisitorRow> & Pick<VisitorRow, "bubble_id" | "session_id" | "nickname" | "is_guest">;
        Update: Partial<VisitorRow>;
      };
      posts: {
        Row: PostRow;
        Insert: Partial<PostRow> & Pick<PostRow, "bubble_id" | "visitor_id" | "content">;
        Update: Partial<PostRow>;
      };
      polls: {
        Row: PollRow;
        Insert: Partial<PollRow> & Pick<PollRow, "bubble_id" | "question" | "options">;
        Update: Partial<PollRow>;
      };
      poll_votes: {
        Row: PollVoteRow;
        Insert: Partial<PollVoteRow> & Pick<PollVoteRow, "poll_id" | "visitor_id" | "option_key">;
        Update: Partial<PollVoteRow>;
      };
      fan_battles: {
        Row: FanBattleRow;
        Insert: Partial<FanBattleRow> & Pick<FanBattleRow, "bubble_id" | "home_team" | "away_team">;
        Update: Partial<FanBattleRow>;
      };
      fan_battle_entries: {
        Row: FanBattleEntryRow;
        Insert: Partial<FanBattleEntryRow> & Pick<FanBattleEntryRow, "fan_battle_id" | "visitor_id" | "selected_team" | "taps">;
        Update: Partial<FanBattleEntryRow>;
      };
    };
    Functions: {
      submit_fan_battle_entry: {
        Args: {
          p_fan_battle_id: string;
          p_visitor_id: string;
          p_selected_team: "home" | "away";
          p_taps: number;
        };
        Returns: FanBattleRow;
      };
    };
  };
};
