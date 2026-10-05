import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, ViewMode } from '../types';
import { format, subDays } from 'date-fns';

export const BADGE_SUPPORTED_VIEWS: ReadonlySet<ViewMode> = new Set<ViewMode>([
  'QUALITY_GATE',
  'FEEDBACK',
  'TEAM',
  'DUTY',
  'ATTENDANCE',
  'FINANCE',
  'DASHBOARD',
  'KPI',
  'WIKI',
  'CHAT',
  'COMPANY_CHECKLIST'
]);

// Table to ViewMode mapping for precise targeted updates
const TABLE_VIEW_MAP: Record<string, ViewMode> = {
  task_reviews: 'QUALITY_GATE',
  feedbacks: 'FEEDBACK',
  profiles: 'TEAM',
  duties: 'DUTY',
  leave_requests: 'ATTENDANCE',
  contents: 'FINANCE',
  tasks: 'DASHBOARD',
  kpi_records: 'KPI',
  wiki_articles: 'WIKI',
  team_messages: 'CHAT'
};

type BadgeListener = (count: number) => void;

class SidebarBadgeManager {
  private counts: Map<ViewMode, number> = new Map();
  private listeners: Map<ViewMode, Set<BadgeListener>> = new Map();
  private activeChannel: RealtimeChannel | null = null;
  private currentUser: User | null = null;
  private subscriberCount = 0;
  private teardownTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceTimers: Map<ViewMode, ReturnType<typeof setTimeout>> = new Map();
  private isFetchingMap: Map<ViewMode, boolean> = new Map();
  private hasInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('juijui-chat-read', this.handleChatRead);
      window.addEventListener('focus', this.handleWindowFocus);
    }
  }

  private handleChatRead = () => {
    this.setCount('CHAT', 0);
  };

  private handleWindowFocus = () => {
    // Refresh only if already initialized and user is active
    if (this.currentUser && this.hasInitialized) {
      this.refreshAllCounts();
    }
  };

  public getCount(view: ViewMode): number {
    return this.counts.get(view) ?? 0;
  }

  private setCount(view: ViewMode, count: number) {
    if (this.counts.get(view) === count) return;
    this.counts.set(view, count);
    const viewListeners = this.listeners.get(view);
    if (viewListeners) {
      viewListeners.forEach(listener => {
        try {
          listener(count);
        } catch (err) {
          console.error(`[BadgeManager] Listener error for ${view}:`, err);
        }
      });
    }
  }

  public subscribe(view: ViewMode, listener: BadgeListener): () => void {
    if (!this.listeners.has(view)) {
      this.listeners.set(view, new Set());
    }
    this.listeners.get(view)!.add(listener);

    // Provide initial cached value immediately
    listener(this.getCount(view));

    return () => {
      const viewListeners = this.listeners.get(view);
      if (viewListeners) {
        viewListeners.delete(listener);
      }
    };
  }

  /**
   * Single Unified Realtime Channel Registration with Reference Counting.
   * Multiple badges share exactly ONE channel.
   */
  public register(currentUser: User): () => void {
    this.currentUser = currentUser;
    this.subscriberCount++;

    // Cancel pending teardown if remounting
    if (this.teardownTimer) {
      clearTimeout(this.teardownTimer);
      this.teardownTimer = null;
    }

    if (!this.activeChannel) {
      this.setupUnifiedChannel(currentUser);
    }

    if (!this.hasInitialized) {
      this.refreshAllCounts();
    }

    return () => {
      this.subscriberCount--;
      if (this.subscriberCount <= 0) {
        // Generous 30s grace period prevents connect/disconnect thrashing on route changes
        this.teardownTimer = setTimeout(() => {
          if (this.subscriberCount <= 0) {
            this.teardown();
          }
        }, 30000);
      }
    };
  }

  private setupUnifiedChannel(currentUser: User) {
    const channelTopic = `unified-sidebar-badges-${currentUser.id}`;

    // Clean up any stale duplicate channel with the same topic
    const existing = supabase.getChannels().find(ch => ch.topic === `realtime:${channelTopic}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    // CREATE ONE SINGLE REALTIME CHANNEL FOR THE ENTIRE APP
    const channel = supabase.channel(channelTopic);

    // Attach targeted listeners for all relevant tables on the single channel
    Object.entries(TABLE_VIEW_MAP).forEach(([table, view]) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          this.debouncedRefresh(view);
        }
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Once connected, do a fresh sync
        this.refreshAllCounts();
      }
    });

    this.activeChannel = channel;
  }

  public debouncedRefresh(view: ViewMode) {
    const existingTimer = this.debounceTimers.get(view);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(view);
      this.fetchViewCount(view);
    }, 400);

    this.debounceTimers.set(view, timer);
  }

  public refreshAllCounts() {
    if (!this.currentUser) return;
    this.hasInitialized = true;

    const viewsToFetch: ViewMode[] = [
      'QUALITY_GATE',
      'FEEDBACK',
      'TEAM',
      'DUTY',
      'ATTENDANCE',
      'FINANCE',
      'DASHBOARD',
      'KPI',
      'WIKI',
      'CHAT'
    ];

    viewsToFetch.forEach(view => {
      this.fetchViewCount(view);
    });
  }

  public async fetchViewCount(view: ViewMode) {
    if (!this.currentUser) return;
    if (this.isFetchingMap.get(view)) return;

    this.isFetchingMap.set(view, true);
    try {
      const count = await this.queryCountFromDatabase(view, this.currentUser);
      this.setCount(view, count);
    } catch (err) {
      console.error(`[BadgeManager] Failed fetching count for ${view}:`, err);
    } finally {
      this.isFetchingMap.set(view, false);
    }
  }

  private async queryCountFromDatabase(view: ViewMode, currentUser: User): Promise<number> {
    const isAdmin = currentUser.role === 'ADMIN';
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    switch (view) {
      case 'QUALITY_GATE': {
        const { data } = await supabase
          .from('task_reviews')
          .select('id, task:tasks(assignee_ids), content:contents(assignee_ids, idea_owner_ids, editor_ids)')
          .eq('status', 'PENDING');

        if (!data) return 0;
        if (isAdmin) return data.length;

        const filtered = data.filter((r: any) => {
          const t = r.task;
          const c = r.content;
          return (
            (t?.assignee_ids || []).includes(currentUser.id) ||
            (c?.assignee_ids || []).includes(currentUser.id) ||
            (c?.idea_owner_ids || []).includes(currentUser.id) ||
            (c?.editor_ids || []).includes(currentUser.id)
          );
        });
        return filtered.length;
      }

      case 'FEEDBACK': {
        if (!isAdmin) return 0;
        const { count } = await supabase
          .from('feedbacks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING');
        return count || 0;
      }

      case 'TEAM': {
        if (!isAdmin) return 0;
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_approved', false);
        return count || 0;
      }

      case 'DUTY': {
        const { count } = await supabase
          .from('duties')
          .select('id', { count: 'exact', head: true })
          .eq('assignee_id', currentUser.id)
          .eq('date', todayStr)
          .eq('is_done', false);
        return count || 0;
      }

      case 'ATTENDANCE': {
        if (!isAdmin) return 0;
        const { count } = await supabase
          .from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING');
        return count || 0;
      }

      case 'FINANCE': {
        if (!isAdmin) return 0;
        const { data: unlinkedData } = await supabase
          .from('contents')
          .select('shoot_date, shoot_location')
          .is('shoot_trip_id', null)
          .not('shoot_date', 'is', null)
          .not('shoot_location', 'is', null);

        if (!unlinkedData) return 0;
        const groups = new Set<string>();
        unlinkedData.forEach((c: any) => {
          const date = c.shoot_date?.split('T')[0];
          const loc = c.shoot_location?.trim().toLowerCase();
          if (date && loc) groups.add(`${date}_${loc}`);
        });
        return groups.size;
      }

      case 'DASHBOARD': {
        const { count } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .contains('assignee_ids', [currentUser.id])
          .lt('end_date', todayStr)
          .not('status', 'eq', 'COMPLETED');
        return count || 0;
      }

      case 'KPI': {
        if (!isAdmin) return 0;
        const monthKey = format(new Date(), 'yyyy-MM');
        const { count } = await supabase
          .from('kpi_records')
          .select('id', { count: 'exact', head: true })
          .eq('month_key', monthKey)
          .eq('status', 'PENDING');
        return count || 0;
      }

      case 'WIKI': {
        const threshold = subDays(new Date(), 2).toISOString();
        const { count } = await supabase
          .from('wiki_articles')
          .select('id', { count: 'exact', head: true })
          .gt('updated_at', threshold);
        return count || 0;
      }

      case 'CHAT': {
        const lastRead = currentUser.lastReadChatAt || new Date(0);
        const { count, error } = await supabase
          .from('team_messages')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', lastRead.toISOString())
          .neq('user_id', currentUser.id);
        return !error ? count || 0 : 0;
      }

      default:
        return 0;
    }
  }

  private teardown() {
    if (this.activeChannel) {
      supabase.removeChannel(this.activeChannel);
      this.activeChannel = null;
    }
    this.debounceTimers.forEach(t => clearTimeout(t));
    this.debounceTimers.clear();
    this.hasInitialized = false;
  }
}

export const sidebarBadgeManager = new SidebarBadgeManager();
