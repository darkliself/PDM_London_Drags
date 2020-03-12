const {google} = require('googleapis');

const keys = require('./keys.json');


const client = new google.auth.JWT(
  keys.client_email, 
  null, 
  keys.private_key, 
  ['https://www.googleapis.com/auth/spreadsheets']
);


client.authorize((err, tokens) => {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log('it a live!');
    gsrun(client);
  }
});


async function gsrun(cl) {
  try {
    const gsapi = google.sheets({version: 'v4', auth: cl});
    // all products

    let list1Data = await gsapi.spreadsheets.values.get({
        spreadsheetId: '1H3mWQrqCNNuNYD76hZRNAwkshEC40iEHUX4gdYkR2FM',
        range: 'List1!A2:F'
      }
    );
  
    // filter data to return all SKUs from main page
    let sku_list1 = list1Data.data.values.map((e)=> {
      return [e[1]];
    });

   

    let list2Data = await gsapi.spreadsheets.values.get({
      spreadsheetId: '1H3mWQrqCNNuNYD76hZRNAwkshEC40iEHUX4gdYkR2FM',
      range: 'List2!A2:A'
    }); 
    let listSKU = [];
    list2Data.data.values.map((elem) => {
      if (elem[0].match(/(\d+)/) != null) {
        listSKU.push(elem[0].match(/(\d+)/)[0]);
      }
    });

    let page1_SKU_link = new Map();
     // get SKU + Link from main page
     let links_list =  list1Data.data.values.map((e)=> {
      page1_SKU_link.set(e[1], e[3]);

    });
    console.log(page1_SKU_link);

    let productSKU = "";
    let test = new Map();
    let links_list_page2 = list2Data.data.values.map((e) => {
      // checked for skus
      if (e[0].match(/(\d+)/) !== null) {
        if (e[0].match(/(\d+)/)[0] !== productSKU) {
          productSKU = e[0].match(/(\d+)/)[0];
          test.set(productSKU);
        }
      }
      // checked for links
      if (e[0].match(/(src=.+?\")/)) {
        var tmp1 = e[0].match(/(src=.+?\")/)[0].replace('src="', '').replace('"', '')};

        if (test.get(productSKU) === undefined) {
          test.set(productSKU, tmp1);
        } else {
          if (tmp1 !== undefined) {
            test.set(productSKU, test.get(productSKU) + tmp1);
          }
        }
      });
      console.log(test);

      page1_SKU_link.forEach((val1, key1, map) => {
        test.forEach((val2, key2) => {
          if (key1 === key2) {
            if (!val2.includes(val1)) {
              console.log(`WARNING SKU ${key1} not contains ${val1}`);
            }
          }
        })
      });

    // create list SKU with only 1 imgs (TEST)
    let uniqSKUList = [];
    for (let i = 0; i < listSKU.length; i++) {
      let count = 0;
      for (let j = 0; j < listSKU.length; j++) {
        if (listSKU[i] == listSKU[j]) {
          count++;
        }
      }
      //console.log(listSKU[i] + " count: " + count);
      if (count == 1) {
        uniqSKUList.push([listSKU[i]]);
      }
    }
    // create list with status "OK"
    let status = [];
    for(let i = 0; i < sku_list1.length; i++) {
      let isOk = false;
      for(let j = 0; j < uniqSKUList.length;j++){
        
        if (sku_list1[i][0] == uniqSKUList[j][0]) {
          isOk = true;
          //console.log(sku_list1[i] + "<>" + uniqSKUList[j]);
        }
      }
      if (isOk) {
        status.push(["ok"]);
      } else {
        status.push([""]);
      }
      
    }
    console.log(status);

    const updOptions = {
      spreadsheetId: '1H3mWQrqCNNuNYD76hZRNAwkshEC40iEHUX4gdYkR2FM',
      range: 'List1!H2',
      valueInputOption: 'USER_ENTERED',
      resource: { values: status }
      };
    // insert result to list1 "comment" col
    await gsapi.spreadsheets.values.update(updOptions);
  }
  // check list of imgs with multiply list



  catch(e) {
    console.log(e);
  }
    
};




