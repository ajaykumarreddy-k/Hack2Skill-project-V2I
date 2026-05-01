'use strict';

/**
 * Google Services client-side integration for Vote2India.
 * Handles Maps, Charts, and Analytics.
 */


/**
 * Initialize Google Charts for election results visualization.
 * @param {string} containerId - DOM element ID to render chart
 * @param {Array} data - Vote data array
 */
function initElectionChart(containerId, data) {
  if (typeof google === 'undefined' || !google.charts) return;
  google.charts.load('current', { packages: ['corechart', 'bar'] });
  google.charts.setOnLoadCallback(() => {
    const chartData = new google.visualization.DataTable();
    chartData.addColumn('string', 'Candidate');
    chartData.addColumn('number', 'Votes');
    chartData.addRows(data);
    const chart = new google.visualization.BarChart(document.getElementById(containerId));
    chart.draw(chartData, { title: 'Constituency Results', height: 400 });
  });
}

/**
 * Initialize Google Maps for constituency boundary display.
 * @param {string} mapElementId - DOM ID for map container
 */
function initConstituencyMap(mapElementId) {
  if (typeof google === 'undefined' || !google.maps) return;
  const map = new google.maps.Map(document.getElementById(mapElementId), {
    center: { lat: 20.5937, lng: 78.9629 }, // India center
    zoom: 5,
  });
  return map;
}

// Google Analytics event tracking
function trackVoterAction(action, label) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, { event_category: 'Voter', event_label: label });
  }
}
