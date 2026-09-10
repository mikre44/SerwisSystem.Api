AUTH
 ethod     ndpoint                  ermission                  Description                        
 -------   ----------------------   ------------------------   ---------------------------------- 
 GET     ►  /api/users            ►  ReadUsers               ►  Gets users                         
 GET     ►  /api/users/{id}       ►  ReadUsers  **or own ID  ►  Gets a specific user               
 GET     ►  /api/users/logged     ►  ogged in                ►  Gets currently logged-in user      
 PUT     ►  /api/users/{id}       ►  EditUsers  **or own ID  ►  Updates username/email             
 DELETE  ►  /api/users/{id}       ►  DeleteUsers             ►  Deletes a user                     
 PUT     ►  /api/users/grant/{id} ►  GrantUsers              ►  Changes another user's permissions 
