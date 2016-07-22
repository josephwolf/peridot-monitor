# peridot-monitor
Internal dashboard for Crowdmix

This was an dashboard tool made for internal use in the office, either on the developers' screen, or on one of the several large wall monitors. The rows showed the various components of our internal structure, while the columns showed the environments. Each box would show the component version, and colour would indicate how many versions behind the latest version each environment was.
The intention was to have an at-a-glance overview of the infrastructure, and be able to keep track of technical debt and versioning issues.
Clicking any box would bring up a modal that would display the commit messages between the newest version and the current version, and links to any associated JIRA tasks.
Both components and environments were filterable (for ease of use) via a side-menu, accessable by clickin the blue tab in the upper left.

Built upon AngularJS, it worked by accessing a meta endpoint that each component had exposed that revealed its version number. These in turn were compared against a hard-coded list of GitHub repo names, and the commit data was retireved between two versions.
Tagging convention made it possible to know which commits were relevant to each version, as well as which JIRA tasks to link.
Peridot was designed to easily accomodate the addition of new components and environments.

Clicking on the Crowdmix logo would take you to the dashboards' secondary functionality; App feature flag monitoring per environment.
This would display the feature flag on the left column, and each subsiquent column represented environments. The boxes indicated if this flag was on or off. Different versions could be selected via the left sidebar.
This data was accessed directly from the app GitHub repo, which contained a JSON file that served simultaniously for the dashboard, and for feature flag control.

The name 'peridot' is both a shade of green, and a rare gem. Also a dorky superhero from the cartoon Steven Universe.
