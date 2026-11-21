// public/js/app.js — Core View Controller & Renderer
// 1-to-1 recreation of Hunter's Claude Design Canvas (#play-15dd8cd198dd)

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Auth gate
  if (window.OperatorAuth) {
    window.OperatorAuth.init();
  }

  const state = {
    activeTab: 'kpi', // 'kpi' | 'calendar' | 'marketing'
    timeFilter: 'month', // 'month' | 'all'
    data: window.DASHBOARD_DATA,
    tiktokLeads: null
  };

  const navTabs = document.querySelectorAll('.nav-tab');
  const mainContent = document.getElementById('main-content');
  const viewTitle = document.getElementById('view-title');
  const viewSubtitle = document.getElementById('view-subtitle');
  const filterRow = document.getElementById('filter-row');

  function renderKpiView() {
    const d = state.data;
    return `
      <!-- Money Section -->
      <section class="dashboard-section">
        <h2 class="section-heading">Money</h2>
        <div class="cards-grid">
          <div class="metric-card">
            <div class="metric-label">Cash</div>
            <div class="metric-value">${d.money.cash.value}</div>
            <div class="metric-subtitle">${d.money.cash.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Monthly burn</div>
            <div class="metric-value">${d.money.monthlyBurn.value}</div>
            <div class="metric-subtitle">${d.money.monthlyBurn.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Recurring burn</div>
            <div class="metric-value">${d.money.recurringBurn.value}</div>
            <div class="metric-subtitle">${d.money.recurringBurn.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Runway</div>
            <div class="metric-value">${d.money.runway.value}</div>
            <div class="metric-subtitle">${d.money.runway.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Revenue</div>
            <div class="metric-value">${d.money.revenue.value}</div>
            <div class="metric-subtitle">${d.money.revenue.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Monthly recurring revenue</div>
            <div class="metric-value">${d.money.mrr.value}</div>
            <div class="metric-subtitle">${d.money.mrr.source}</div>
          </div>
        </div>
      </section>

      <!-- Growth Section -->
      <section class="dashboard-section">
        <h2 class="section-heading">Growth</h2>
        <div class="cards-grid">
          <div class="metric-card">
            <div class="metric-label">Website visitors</div>
            <div class="metric-value">${d.growth.visitors.value}</div>
            <div class="metric-subtitle">${d.growth.visitors.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Signups</div>
            <div class="metric-value">${d.growth.signups.value}</div>
            <div class="metric-subtitle">${d.growth.signups.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Email subscribers</div>
            <div class="metric-value">${d.growth.subscribers.value}</div>
            <div class="metric-subtitle">${d.growth.subscribers.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Tickets sold</div>
            <div class="metric-value">${d.growth.ticketsSold.value}</div>
            <div class="metric-subtitle">${d.growth.ticketsSold.source}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Discord members</div>
            <div class="metric-value">${d.growth.discordMembers.value}</div>
            <div class="metric-subtitle">${d.growth.discordMembers.source}</div>
          </div>
        </div>
      </section>

      <!-- Social Section -->
      <section class="dashboard-section">
        <div class="table-card">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div class="table-title">Social</div>
            <span style="font-size: 11px; color: var(--text-muted); background: #FAF0E6; padding: 2px 6px; border-radius: 4px;">Unconnected · Mockup Baseline</span>
          </div>
          <div class="table-subtitle">7-day change (pending live API connectors)</div>
          <table>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Followers</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${d.social.map(s => `
                <tr>
                  <td>${s.channel}</td>
                  <td>${s.followers}</td>
                  <td class="text-positive">${s.change}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Per pop-up Section -->
      <section class="dashboard-section">
        <div class="table-card">
          <div class="table-title">Per pop-up</div>
          <div class="table-subtitle">Stripe + Mercury</div>
          <table>
            <thead>
              <tr>
                <th>Pop-up</th>
                <th>Tickets</th>
                <th>Revenue</th>
                <th>Running costs</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              ${d.popups.map(p => {
                const isNeg = p.profit.startsWith('−') || p.profit.startsWith('-');
                return `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.tickets}</td>
                    <td>${p.revenue}</td>
                    <td>${p.costs}</td>
                    <td class="${isNeg ? 'text-negative' : 'text-positive'}">${p.profit}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderCalendarView() {
    const c = state.data.calendar;

    // Days in Nov 2026: Nov 1, 2026 is Sunday (30 days total)
    // Pinned events on calendar:
    // 11: Downtown winter night market
    // 18: Holiday lights walk
    // 22: Spring arts festival
    const pinned = {
      11: "Downtown winter night market",
      18: "Holiday lights walk",
      22: "Spring arts festival"
    };

    let calendarDaysHtml = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => {
      calendarDaysHtml += `<div class="calendar-day-header">${d}</div>`;
    });

    for (let day = 1; day <= 30; day++) {
      const eventText = pinned[day] ? `<div class="day-event">${pinned[day]}</div>` : '';
      calendarDaysHtml += `
        <div class="calendar-day-cell">
          <span class="day-number">${day}</span>
          ${eventText}
        </div>
      `;
    }

    return `
      <!-- Badges -->
      <div class="calendar-badges">
        <div class="badge-item">
          <span class="badge-count">${c.inProgress}</span>
          <span class="badge-label">In progress</span>
        </div>
        <div class="badge-item">
          <span class="badge-count">${c.bookedLocations}</span>
          <span class="badge-label">Booked locations</span>
        </div>
      </div>

      <!-- Apply or reach out by -->
      <section class="dashboard-section">
        <h2 class="section-heading">Apply or reach out by</h2>
        <div class="cards-grid">
          ${c.applyBy.map(item => `
            <div class="metric-card" style="padding: 18px;">
              <div class="metric-label" style="font-size: 14px; font-weight: 600; color: #181818; margin-bottom: 4px;">${item.date}</div>
              <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">${item.title}</div>
              <div class="metric-subtitle">${item.location}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Coming up -->
      <section class="dashboard-section">
        <h2 class="section-heading">Coming up</h2>
        <div class="cards-grid">
          ${c.comingUp.map(item => `
            <div class="metric-card" style="padding: 18px;">
              <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #8E8A83;">${item.month}</span>
                <span style="font-size: 20px; font-weight: 700; color: #181818;">${item.day}</span>
              </div>
              <div style="font-size: 15px; font-weight: 500; margin-bottom: 4px;">${item.title}</div>
              <div class="metric-subtitle">${item.location}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Calendar Grid Section -->
      <section class="dashboard-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 class="section-heading" style="margin-bottom: 0;">November 2026</h2>
          <div class="filter-pills">
            <button class="filter-pill active">Month</button>
            <button class="filter-pill">Year</button>
          </div>
        </div>
        <div class="calendar-grid">
          ${calendarDaysHtml}
        </div>
      </section>
    `;
  }

  function renderMarketingView() {
    const m = state.data.marketing;
    const leadsTotals = (state.tiktokLeads && state.tiktokLeads.totals) || { leadsCount: 46, pipelineTotalDiamonds: 443, statusCounts: { uncontacted: 46, dm_sent: 0 } };
    const leadsList = (state.tiktokLeads && state.tiktokLeads.leads) || [];
    return `
      <!-- Funnel Section -->
      <section class="dashboard-section">
        <h2 class="section-heading">Funnel</h2>
        <div class="funnel-row">
          <div class="metric-card" style="flex: 1;">
            <div class="metric-label">Website visitors</div>
            <div class="metric-value">${m.funnel.visitors}</div>
            <div class="metric-subtitle">PostHog</div>
          </div>
          <div class="funnel-arrow">
            <span style="font-size: 20px;">➔</span>
            <span>${m.funnel.conversionRate}</span>
          </div>
          <div class="metric-card" style="flex: 1;">
            <div class="metric-label">Signups</div>
            <div class="metric-value">${m.funnel.signups}</div>
            <div class="metric-subtitle">Supabase</div>
          </div>
        </div>
      </section>

      <!-- Flywheel Section -->
      <section class="dashboard-section">
        <h2 class="section-heading">Flywheel</h2>
        <div class="flywheel-badge-group">
          <div class="metric-card">
            <div class="metric-label">Characters → attractions</div>
            <div class="metric-value">${m.flywheel.charactersToAttractions}</div>
            <div class="metric-subtitle">Supabase + Stripe</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Attractions → characters</div>
            <div class="metric-value">${m.flywheel.attractionsToCharacters}</div>
            <div class="metric-subtitle">Supabase + Stripe</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">People who did both</div>
            <div class="metric-value">${m.flywheel.peopleWhoDidBoth}</div>
            <div class="metric-subtitle">Supabase + Stripe</div>
          </div>
        </div>
      </section>

      <!-- Cohorts Table -->
      <section class="dashboard-section">
        <div class="table-card">
          <div class="table-title">Does doing both matter</div>
          <div class="table-subtitle">Supabase + Stripe</div>
          <table>
            <thead>
              <tr>
                <th>Who</th>
                <th>People</th>
                <th>Came back within 30 days</th>
                <th>Average spend</th>
              </tr>
            </thead>
            <tbody>
              ${m.cohorts.map(c => `
                <tr ${c.who === 'Both' ? 'style="font-weight: 600; background: #FAF9F5;"' : ''}>
                  <td>${c.who}</td>
                  <td>${c.people}</td>
                  <td class="${c.who === 'Both' ? 'text-positive' : ''}">${c.retention30d}</td>
                  <td>${c.avgSpend}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- TikTok Telemetry -->
      <section class="dashboard-section">
        <h2 class="section-heading">TikTok</h2>
        <div class="cards-grid">
          <div class="metric-card">
            <div class="metric-label">Live viewers</div>
            <div class="metric-value">${m.tiktok.liveViewers}</div>
            <div class="metric-subtitle">TikTok</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Hours live</div>
            <div class="metric-value">${m.tiktok.hoursLive}</div>
            <div class="metric-subtitle">TikTok</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">New followers</div>
            <div class="metric-value">${m.tiktok.newFollowers}</div>
            <div class="metric-subtitle">TikTok</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Accounts linked</div>
            <div class="metric-value">${m.tiktok.accountsLinked}</div>
            <div class="metric-subtitle">Supabase</div>
          </div>
        </div>
      </section>

      <!-- TikTok LIVE Leads CRM Section -->
      <section class="dashboard-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
          <div>
            <h2 class="section-heading" style="margin-bottom: 4px;">TikTok LIVE Leads CRM</h2>
            <div class="metric-subtitle">46 Unfulfilled Donors · Spoken reading owed · Synced with Supabase</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <span class="live-badge" style="background:#EBF5FB; color:#2980B9;">${leadsTotals.leadsCount || 46} Leads</span>
            <span class="live-badge" style="background:#FEF9E7; color:#B7950B;">${leadsTotals.pipelineTotalDiamonds || 443} 💎 Pipeline</span>
            <span class="live-badge" style="background:#E8F8F5; color:#117A65;">Supabase Live</span>
          </div>
        </div>

        <div class="table-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div>
              <div class="table-title">Unfulfilled Reading Pipeline</div>
              <div class="table-subtitle">Patrons who gifted diamonds during stream without an answer</div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              ${(leadsTotals.statusCounts && leadsTotals.statusCounts.uncontacted) !== undefined ? leadsTotals.statusCounts.uncontacted : 46} Uncontacted · ${(leadsTotals.statusCounts && leadsTotals.statusCounts.dm_sent) || 0} DMs Sent
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Total Diamonds</th>
                <th>Tier</th>
                <th>Gifts Sent</th>
                <th>Status</th>
                <th>Next Step</th>
              </tr>
            </thead>
            <tbody>
              ${leadsList.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">Loading leads from Supabase...</td>
                </tr>
              ` : leadsList.map(l => {
                const giftsSummary = (l.gifts || []).map(g => `${g.giftName || 'Gift'} x${g.giftCount || 1}`).join(', ') || 'Gift';
                const status = l.lead_status || 'uncontacted';
                return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <a href="${l.profile_url}" target="_blank" rel="noopener" style="color: var(--text-main); font-weight: 600; text-decoration: none;">
                        @${l.username}
                      </a>
                      ${l.display_name && l.display_name !== l.username ? `<span style="font-size: 11px; color: var(--text-sub);">(${l.display_name})</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <span style="font-weight: 600; color: #B7950B;">${l.total_diamonds} 💎</span>
                  </td>
                  <td>
                    <span style="font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 9999px; background: #FAF9F5; border: 1px solid var(--border-card);">
                      ${l.tier}
                    </span>
                  </td>
                  <td style="font-size: 12px; color: var(--text-muted); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${giftsSummary}">
                    ${giftsSummary}
                  </td>
                  <td>
                    <select onchange="window.updateLeadStatus('${l.username}', this.value)" style="border: 1px solid var(--border-card); background: #FAF8F5; padding: 4px 8px; border-radius: 6px; font-size: 12px; color: var(--text-main); cursor: pointer;">
                      <option value="uncontacted" ${status === 'uncontacted' ? 'selected' : ''}>⬜ Uncontacted</option>
                      <option value="dm_sent" ${status === 'dm_sent' ? 'selected' : ''}>🟡 DM Sent</option>
                      <option value="replied" ${status === 'replied' ? 'selected' : ''}>🔮 Replied</option>
                      <option value="reading_given" ${status === 'reading_given' ? 'selected' : ''}>📜 Reading Given</option>
                      <option value="converted" ${status === 'converted' ? 'selected' : ''}>🎉 Converted</option>
                    </select>
                  </td>
                  <td style="font-size: 12px; color: var(--text-muted);">
                    ${l.next_step || (status === 'uncontacted' ? 'Send DM' : 'Follow up')}
                  </td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Online Characters -->
      <section class="dashboard-section">
        <h2 class="section-heading">Online characters</h2>
        <div class="cards-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="metric-card">
            <div class="metric-label">People chatting</div>
            <div class="metric-value">${m.onlineCharacters.peopleChatting}</div>
            <div class="metric-subtitle">Supabase</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Came back</div>
            <div class="metric-value">${m.onlineCharacters.cameBack}</div>
            <div class="metric-subtitle">Supabase</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Paying</div>
            <div class="metric-value">${m.onlineCharacters.paying}</div>
            <div class="metric-subtitle">Stripe</div>
          </div>
        </div>
      </section>

      <!-- Attractions Attribution -->
      <section class="dashboard-section">
        <div class="table-card">
          <div class="table-title">Where people came from</div>
          <div class="table-subtitle">PostHog + Stripe</div>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Signups</th>
                <th>Tickets</th>
                <th>Spend</th>
                <th>Cost per ticket</th>
              </tr>
            </thead>
            <tbody>
              ${m.attribution.map(a => `
                <tr>
                  <td>${a.source}</td>
                  <td>${a.type}</td>
                  <td>${a.signups}</td>
                  <td>${a.tickets}</td>
                  <td>${a.spend}</td>
                  <td>${a.cac}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function updateView() {
    navTabs.forEach(t => {
      if (t.dataset.tab === state.activeTab) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    if (state.activeTab === 'kpi') {
      viewTitle.textContent = 'KPI dashboard';
      viewSubtitle.textContent = `Updated ${state.data.updatedAt}`;
      filterRow.style.display = 'flex';
      mainContent.innerHTML = renderKpiView();
    } else if (state.activeTab === 'calendar') {
      viewTitle.textContent = 'All cities calendar';
      viewSubtitle.textContent = `Updated ${state.data.updatedAt} | Via GrokBot`;
      filterRow.style.display = 'none';
      mainContent.innerHTML = renderCalendarView();
    } else if (state.activeTab === 'marketing') {
      viewTitle.textContent = 'Marketing';
      viewSubtitle.textContent = `Updated ${state.data.updatedAt}`;
      filterRow.style.display = 'flex';
      mainContent.innerHTML = renderMarketingView();
    }
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.tab;
      updateView();
    });
  });

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      state.timeFilter = e.target.textContent.toLowerCase().includes('month') ? 'month' : 'all';
      updateView();
    });
  });

  // Fetch live metrics from Netlify Function
  async function fetchLiveMetrics() {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const live = await res.json();
        if (live && live.growth) {
          state.data = Object.assign({}, state.data, live);
          window.DASHBOARD_DATA = state.data;
          
          // Update the header badge with real connection status
          const headerBadge = document.querySelector('.header-container .live-badge');
          if (headerBadge && live.sourcesStatus) {
            const liveCount = Object.values(live.sourcesStatus).filter(s => s === 'live').length;
            headerBadge.textContent = `🟢 ${liveCount}/5 Live`;
            headerBadge.title = Object.entries(live.sourcesStatus).map(([k, v]) => `${k}: ${v}`).join(', ');
          }

          updateView();
          console.log('[Live Metrics] Synchronized with production data connectors:', live.sourcesStatus);
        }
      }
    } catch (e) {
      console.warn('[Live Metrics] Fetch failed, using baseline data:', e);
    }
  }

  // Fetch TikTok LIVE unfulfilled donor leads from Supabase
  async function fetchTikTokLeads() {
    try {
      const res = await fetch('/api/tiktok-leads');
      if (res.ok) {
        state.tiktokLeads = await res.json();
        if (state.activeTab === 'marketing') {
          updateView();
        }
        console.log('[TikTok Leads] Synced with Supabase:', state.tiktokLeads?.totals);
      }
    } catch (e) {
      console.warn('[TikTok Leads] Fetch failed:', e);
    }
  }

  window.updateLeadStatus = async function(username, newStatus) {
    try {
      const res = await fetch('/api/tiktok-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, lead_status: newStatus })
      });
      if (res.ok) {
        await fetchTikTokLeads();
      }
    } catch (e) {
      console.error('Failed to update lead status:', e);
    }
  };

  // Initial render & live sync
  updateView();
  fetchLiveMetrics();
  fetchTikTokLeads();
});
