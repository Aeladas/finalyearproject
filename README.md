# Final-Year-Project
This repo holds the files that relate to my project


Scope of API Access:
[X] Read your Destiny 2 information (Vault, Inventory, and Vendors), as well as Destiny 1 Vault and Inventory data.
[ ] Read your Destiny 1 Vendor and Advisor information.
[X] Move or equip Destiny gear and other items.
[X] Administrate groups and clans for which you are a founder or administrator.
[X] Access items like your Bungie.net notifications, memberships, and recent Bungie.Net forum activity.


Added:

  > A member request function that when given 3 values (Platform, Username and Display Code) retrieves information about the user such as their membershipId.

Challenges:
  > Firstly, the method for searching players had to be found via forums.
  > Secondly, there was an issue with sending information to the API due to the POST method requiring JSON formatted parameters
  > Thirdly, after recieving a response 500 an issue was solved where the API was only accepting one localhost so adjustments to the scope had to be made to allow for any localhost
  > Finally, an issue with reading the response was a small issue but was resolved quickly.