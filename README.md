## App Creation and Deployment Readme

*If you do not have a private space created*, you will need to create one in the appropriate region (as close to your Salesforce instance as possible) prior to clicking the Deploy button.

After clicking the Deploy button at the bottom of this page, it will take you to an app setup wizard.

1. For the "App name" field, please enter your company identifier (one word) followed by "-pct-cust" for trials or "-pc-cust" for production users.

*The total length cannot exceed 30 characters*.
Example: "mycompany-pc-cust"

2. For the "Choose a region or a Private Space" section, please select "Private Space".

3. Then select your previously-created private space.

Do __NOT__ select the "Make this app internal" option or your app will not function correctly.

4. Fill in the Config Vars section according to the directions on the wizard.

5. Then click "Deploy app".

Please note that provisioning the new app will take around 10 minutes or longer, primarily for the database.

#### Deploy standard customer app - Must have 360 access
[![Deploy App to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)