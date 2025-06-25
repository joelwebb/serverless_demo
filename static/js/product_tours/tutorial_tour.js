
// Tutorial tour configuration using Shepherd.js
function getPageSpecificTutorial() {
  const pathname = window.location.pathname;
  
  const tutorials = {
    '/equipment': [
      {
        text: 'Welcome to the Equipment page! Here you can manage your character\'s gear.',
        attachTo: { element: '.page-header-title', on: 'bottom' }
      },
      {
        text: 'Browse different equipment categories here. Click on items to view their stats.',
        attachTo: { element: '.equipment-card', on: 'right' }
      },
      {
        text: 'Preview how equipment looks on your character here.',
        attachTo: { element: '.character-preview', on: 'left' }
      },
      {
        text: 'View detailed item stats and abilities in this panel.',
        attachTo: { element: '.equipment-details', on: 'left' }
      }
    ],
    '/abilities': [
      {
        text: 'Welcome to the Abilities page! Here you can view and upgrade your skills.',
        attachTo: { element: '.page-header-title', on: 'bottom' }
      }
    ],
    '/team': [
      {
        text: 'Welcome to the Team Management page!',
        attachTo: { element: '.page-header-title', on: 'bottom' }
      },
      {
        text: 'View and manage your team composition here.',
        attachTo: { element: '.team-container', on: 'bottom' }
      }
    ],
    '/map': [
      {
        text: 'Welcome to the World Map!',
        attachTo: { element: '.page-header-title', on: 'bottom' }
      },
      {
        text: 'Select levels and areas to explore.',
        attachTo: { element: '.map-container', on: 'bottom' }
      }
    ],
    '/lore': [
      {
        text: 'Discover the rich story and lore of Gridfall Chronicles.',
        attachTo: { element: '.page-header-title', on: 'bottom' }
      }
    ]
  };

  return tutorials[pathname] || [
    {
      text: 'Welcome to Gridfall Chronicles!',
      attachTo: { element: '.b-brand', on: 'bottom' }
    }
  ];
}

function startTutorialTour() {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      classes: 'shadow-md bg-purple-dark',
      scrollTo: true,
      buttons: [
        {
          text: 'Skip',
          action: tour.complete
        },
        {
          text: 'Next',
          action: tour.next
        }
      ]
    }
  });

  const steps = getPageSpecificTutorial();
  steps.forEach(step => tour.addStep(step));
  
  tour.start();
}
