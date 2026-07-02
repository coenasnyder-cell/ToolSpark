We are working on creating a template to save time and money lol. time is money haha.

This is also mainly designed to lighten your workload and so you know what to create when you create a page for tools.

The goal is to create a template based on the landing page of the journey.html. 

Here is what i know would be included:

<body data-page-title="Journey Map">

<div class="state-wrap" id="loadingState" style="display:flex;">
  <div class="state-card">
    <div class="loading"></div>
    <h2>Loading your journey ingredients</h2>
    <p id="loadingMessage">Pulling in your Spark, Audience, and Transformation work now.</p>
  </div>
</div>

<div class="state-wrap" id="blockedState">
  <div class="state-card">
    <div class="eyebrow">Journey Map</div>
    <h2 id="blockedTitle">You are almost there.</h2>
    <p id="blockedCopy">This page needs a little more of your foundation work before it can build a strong customer journey map.</p>
    <ul class="checklist" id="blockedChecklist"></ul>
    <div class="state-links" id="blockedLinks"></div>
  </div>
</div>

<main class="shell hidden" id="appShell">
  <section class="hero">
    <div class="hero-card">
      <div class="hero-overlay-text">
        <div class="eyebrow">Phase 3</div>
        <h1>Generate the journey <em>your customer is really on.</em></h1>
        <p class="hero-copy">This page turns your transformation goal into a customer journey map you can actually build tools around.</p>
        <div class="hero-note">Your Spark and Audience are already loaded behind the scenes.</div>
      </div>
    </div>
  </section>

  <!-- Roadmap (attached to bottom of hero) -->
  <div class="roadmap-outer">
    <div class="roadmap">
      <div class="roadmap-step done">
        <div class="step-circle"><i data-lucide="zap" width="15" height="15"></i></div>
        <div class="step-label">Spark</div>
      </div>
      <div class="step-connector done"></div>
      <div class="roadmap-step done">
        <div class="step-circle"><i data-lucide="users" width="15" height="15"></i></div>
        <div class="step-label">Audience</div>
      </div>
      <div class="step-connector done"></div>
      <div class="roadmap-step done">
        <div class="step-circle"><i data-lucide="sparkles" width="15" height="15"></i></div>
        <div class="step-label">Transformation</div>
      </div>
      <div class="step-connector"></div>
      <div class="roadmap-step active">
        <div class="step-here">YOU ARE HERE</div>
        <div class="step-circle"><i data-lucide="map" width="15" height="15"></i></div>
        <div class="step-label">Journey Map</div>
      </div>
      <div class="step-connector"></div>
      <div class="roadmap-step">
        <div class="step-circle"><i data-lucide="wrench" width="15" height="15"></i></div>
        <div class="step-label">Tool Map</div>
      </div>
      <div class="step-connector"></div>
      <div class="roadmap-step">
        <div class="step-circle"><i data-lucide="rocket" width="15" height="15"></i></div>
        <div class="step-label">Launch</div>
      </div>
    </div>
  </div>

  <section class="grid">
    <article class="panel panel-full transformation-panel">
      <h2>The Transformation</h2>
      <div class="transformation">
        <div class="transform-box">
          <div class="transform-box-title">
            <span class="transform-box-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16v-2a2 2 0 0 0-4 0v2"/><path d="M9.5 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><rect x="13" y="16" width="8" height="5" rx=".899"/></svg>
            </span>
            Where they start
          </div>
          <ul class="transform-points" id="transformStart"></ul>
        </div>
        <div class="transform-arrow">&rarr;</div>
        <div class="transform-box">
          <div class="transform-box-title">
            <span class="transform-box-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.194 13.707 3.814 1.86-1.86 3.814"/><path d="M16.47214 7.52786 A 5 10 0 1 0 13 21.79796"/><path d="M21.79796 11 A 10 5 0 1 0 19 15.57071"/></svg>
            </span>
            Where they want to be
          </div>
          <ul class="transform-points" id="transformEnd"></ul>
        </div>
      </div>
      <div class="transform-identity">
        <span class="transform-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>
        </span>
        <div class="transform-identity-body">
          <span class="transform-identity-label">Identity Shift</span>
          <p id="transformIdentity"></p>
        </div>
      </div>
    </article>

    <article class="panel panel-full generate-panel">
      <div class="define-divider">
        <div class="divider-line"></div>
        <div class="divider-text">Generate Your Journey Map</div>
        <div class="divider-line"></div>
      </div>
      <ul class="mini-list build-list">
        <li>
          <span class="build-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/></svg></span>
          <span>A staged journey map from stuck to transformed.</span>
        </li>
        <li>
          <span class="build-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M8 21l4-13 4 13M5 21h14M11.5 12.5L14 8l2 3"/><path d="M14 8l3-3 2 2-3 3"/></svg></span>
          <span>The biggest obstacles that keep showing up along the way.</span>
        </li>
        <li>
          <span class="build-icon"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></span>
          <span>Specific tool opportunities for each stage of the journey.</span>
        </li>
      </ul>
      <div class="actions">
        <button class="primary-btn" id="generateBtn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v4M3 12h4M12 21v-4M21 12h-4M6.3 6.3l2.1 2.1M17.7 6.3l-2.1 2.1M6.3 17.7l2.1-2.1M17.7 17.7l-2.1-2.1"/></svg>
          <span id="generateBtnLabel">Generate My Journey Map</span>
        </button>
        <a class="ghost-btn hidden" href="journeyresults.html" id="secondaryResultsBtn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-8L9 5H5a2 2 0 00-2 2z"/></svg>
          <span>Open Current Results</span>
        </a>
      </div>
      <div class="helper" id="generateHelper">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2.3h6c0-1 .4-1.7 1-2.3A7 7 0 0012 2z"/></svg>
        <span id="generateHelperText">This will save into your journey map results.</span>
      </div>
    </article>
  </section>

  <!-- Bottom Banner -->
  <div class="bottom-banner">
    <div class="banner-glow"></div>
    <div class="bottom-banner-copy">
      <p>You have figured out what transformation you can create.</p>
      <p><em>Let's map out the Customer's Journey.</em></p>
    </div>
  </div>
</main>

Here is the things that are fuzzy to me:
CSS styles- I am afraid if I give you the list, i will forget something
functions-most tools will pull data so this could be set but have placeholders. 

scripts-most tools will need topbar.js, and auth.js. 

Should there be templates for sections or just a whole page and then just create a section in my notes for the css styles nad code for specific sections with line numbers attached. 

For instance, if I want to go back and add a roadmap to each of the roadmap steps, this might make it easier

The before and after or where they start where they end up
for instance, if I wanted to carry this over 

What are the options for achieving this?

The do not include list:
Chats or next steps other than a button that would be wired up at time of creation. 



There are these bullet points coming through and I cant find where.




The goal is to remove the black bullet points and leave the icons or whatever they are. They could be bullets just don't know whey there are two of them 

Confirm that you have read this, ask any questions that you are not sure about. Please don't break the code for the next page or chat that is on second page while making changes. 