import puppeteer from "puppeteer-core";

async function generatePDF(data) {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    let htmlContent = ``;

    switch (true) {
      case data.category === "Embroidery":
        htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Naila Arts Gatepass</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html {
                -webkit-print-color-adjust: exact;
              }
        

      body {
        font-family: "Poppins", sans-serif;
      }

      input {
        border: none;
      }

      .mr_2 {
        margin-right: 14px;
      }

      .flex_c {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .main {
        width: 100%;
      }

      .gatepass_01,
      .gatepass_02 {
        border: 0.7px solid rgb(150, 150, 150);
        border-radius: 6px;
        margin-inline: 1.5rem;
        margin-block: 1rem;
        padding: 1rem 0.5rem;
        min-height: 48vh;
      }

      .header_heading {
        font-weight: 600;
        font-size: 1.45rem;
        margin-bottom: 0.7rem;
      }

      .header_row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .header_title {
        font-weight: 600;
        font-size: 0.75rem;
        padding-left: 0.5rem;
      }

      .header_data {
        border-bottom: 1px dashed black;
        min-width: 5rem;
        text-align: center;
        font-size: 0.6rem;
      }

      .gatepass_body {
        padding-top: 0.4rem;
      }

      .data_row {
        width: 100%;
        background-color: #ebebeb;
        padding: 0.6rem;
        border-radius: 6px;
        margin-top: 0.6rem;
      }

      .data_row_heading {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
      }

      .row_details {
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }

      .row_details span {
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main class="main">
      <section class="gatepass_01">
        <div class="header">
          <h2 class="header_heading">Embroidery Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <p class="data_row_heading">Shirts Colors and Quantity</p>
            ${
              data.shirtData &&
              data.shirtData
                .map(
                  (item) => `
                <div class="row_details">
                  <span>
                    ${item.color} (${item.quantity_in_no})
                  </span>
                </div>
              `
                )
                .join("")
            }
          </div>
          <div class="data_row">
            <p class="data_row_heading">Dupatta Colors and Quantity</p>
           ${
             data.dupattaData &&
             data.dupattaData
               .map(
                 (item) => `
               <div class="row_details">
                 <span>
                   ${item.color} (${item.quantity_in_no})
                 </span>
               </div>
             `
               )
               .join("")
           }
          </div>
          <div class="data_row">
            <p class="data_row_heading">Trouzer Colors and Quantity</p>
            ${
              data.trouserData &&
              data.trouserData
                .map(
                  (item) => ` 
                <div class="row_details">
                  <span>
                    ${item.color} (${item.quantity_in_no})
                  </span>
                </div>
              `
                )
                .join("")
            }
          </div>
        </div>
        <div class="footer"></div>
      </section>
      <section class="gatepass_02">
        <div class="header">
          <h2 class="header_heading">Embroidery Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <p class="data_row_heading">Shirts Colors and Quantity</p>
            ${
              data.shirtData &&
              data.shirtData
                .map(
                  (item) => `
                <div class="row_details">
                  <span>
                    ${item.color} (${item.quantity_in_no})
                  </span>
                </div>
              `
                )
                .join("")
            }
          </div>
          <div class="data_row">
            <p class="data_row_heading">Dupatta Colors and Quantity</p>
            ${
              data.dupattaData &&
              data.dupattaData
                .map(
                  (item) => `
                <div class="row_details">
                  <span>
                    ${item.color} (${item.quantity_in_no})
                  </span>
                </div>
              `
                )
                .join("")
            }
          </div>
          <div class="data_row">
            <p class="data_row_heading">Trouzer Colors and Quantity</p>
            ${
              data.trouserData &&
              data.trouserData
                .map(
                  (item) => `
                <div class="row_details">
                  <span>
                    ${item.color} (${item.quantity_in_no})
                  </span>
                </div>
              `
                )
                .join("")
            }
          </div>
        </div>
        <div class="footer"></div>
      </section>
    </main>
  </body>
</html>

`;
        break;
      case data.category === "Calender":
        htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Naila Arts Gatepass</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: "Poppins", sans-serif;
      }

      html {
                -webkit-print-color-adjust: exact;
              }

      input {
        border: none;
      }

      .mr_2 {
        margin-right: 14px;
      }

      .flex_c {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .main {
        width: 100%;
      }

      .gatepass_01,
      .gatepass_02 {
        border: 0.7px solid rgb(150, 150, 150);
        border-radius: 6px;
        margin-inline: 1.5rem;
        margin-block: 1rem;
        padding: 1rem 0.5rem;
        min-height: 48vh;
      }

      .header_heading {
        font-weight: 600;
        font-size: 1.45rem;
        margin-bottom: 0.7rem;
      }

      .header_row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .header_title {
        font-weight: 600;
        font-size: 0.75rem;
        padding-left: 0.5rem;
      }

      .header_data {
        border-bottom: 1px dashed black;
        min-width: 5rem;
        text-align: center;
        font-size: 0.6rem;
      }

      .gatepass_body {
        padding-top: 0.4rem;
      }

      .data_row {
        width: 100%;
        background-color: #ebebeb;
        padding: 0.6rem;
        border-radius: 6px;
        margin-top: 0.6rem;
      }

      .data_row_heading {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
      }

      .row_details {
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }

      .row_details span {
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main class="main">
      <section class="gatepass_01">
        <div class="header">
          <h2 class="header_heading">Calendar Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <p class="data_row_heading">Quantity</p>
            <div class="row_details">
              <span>${data.T_Quantity}</span>    
            </div>
          </div>
        </div>
      </section>

      <section class="gatepass_02">
        <div class="header">
          <h2 class="header_heading">Calendar Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <p class="data_row_heading">Quantity</p>
            <div class="row_details">
              <span>${data.T_Quantity}</span>          
            </div>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
        break;

      case data.category === "Cutting":
        htmlContent = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Naila Arts Gatepass</title>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");
  
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
  
        body {
          font-family: "Poppins", sans-serif;
        }
  
        html {
                  -webkit-print-color-adjust: exact;
                }
  
        input {
          border: none;
        }
  
        .mr_2 {
          margin-right: 14px;
        }
  
        .flex_c {
          display: flex;
          align-items: center;
          gap: 8px;
        }
  
        .main {
          width: 100%;
        }
  
        .gatepass_01,
        .gatepass_02 {
          border: 0.7px solid rgb(150, 150, 150);
          border-radius: 6px;
          margin-inline: 1.5rem;
          margin-block: 1rem;
          padding: 1rem 0.5rem;
          min-height: 48vh;
        }
  
        .header_heading {
          font-weight: 600;
          font-size: 1.45rem;
          margin-bottom: 0.7rem;
        }
  
        .header_row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
  
        .header_title {
          font-weight: 600;
          font-size: 0.75rem;
          padding-left: 0.5rem;
        }
  
        .header_data {
          border-bottom: 1px dashed black;
          min-width: 5rem;
          text-align: center;
          font-size: 0.6rem;
        }
  
        .gatepass_body {
          padding-top: 0.4rem;
        }
  
        .data_row {
          width: 100%;
          background-color: #ebebeb;
          padding: 0.6rem;
          border-radius: 6px;
          margin-top: 0.6rem;
        }
  
        .data_row_heading {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
        }
  
        .row_details {
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
  
        .row_details span {
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <main class="main">
        <section class="gatepass_01">
          <div class="header">
            <h2 class="header_heading">Calendar Gate pass</h2>
            <div class="header_row">
              <div class="header_box mr_2 flex_c">
                <p class="header_title">Party_Name:</p>
                <p class="header_data">${data.partyName}</p>
              </div>
              <div class="header_box mr_2 flex_c">
                <p class="header_title">Serial No:</p>
                <p class="header_data">${data.serial_No}</p>
              </div>
              <div class="header_box flex_c">
                <p class="header_title">Date:</p>
                <p class="header_data">${data.date}</p>
              </div>
              <div class="header_box flex_c">
                <p class="header_title">Design No:</p>
                <p class="header_data">${data.design_no}</p>
              </div>
            </div>
          </div>
          <div class="gatepass_body">
            <div class="data_row">
              <p class="data_row_heading">Quantity</p>
              <div class="row_details">
                <span>${data.T_Quantity}</span>    
              </div>
            </div>
          </div>
        </section>
  
        <section class="gatepass_02">
          <div class="header">
            <h2 class="header_heading">Calendar Gate pass</h2>
            <div class="header_row">
              <div class="header_box mr_2 flex_c">
                <p class="header_title">Party_Name:</p>
                <p class="header_data">${data.partyName}</p>
              </div>
              <div class="header_box mr_2 flex_c">
                <p class="header_title">Serial No:</p>
                <p class="header_data">${data.serial_No}</p>
              </div>
              <div class="header_box flex_c">
                <p class="header_title">Date:</p>
                <p class="header_data">${data.date}</p>
              </div>
              <div class="header_box flex_c">
                <p class="header_title">Design No:</p>
                <p class="header_data">${data.design_no}</p>
              </div>
            </div>
          </div>
          <div class="gatepass_body">
            <div class="data_row">
              <p class="data_row_heading">Quantity</p>
              <div class="row_details">
                <span>${data.T_Quantity}</span>          
              </div>
            </div>
          </div>
        </section>
      </main>
    </body>
  </html>`;
        break;

      case data.category === "Stone":
        htmlContent = `
          <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Naila Arts Gatepass</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html {
                  -webkit-print-color-adjust: exact;
                }

      body {
        font-family: "Poppins", sans-serif;
      }

      input {
        border: none;
      }

      .mr_2 {
        margin-right: 14px;
      }

      .flex_c {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .main {
        width: 100%;
      }

      .gatepass_01,
      .gatepass_02 {
        border: 0.7px solid rgb(150, 150, 150);
        border-radius: 6px;
        margin-inline: 1.5rem;
        margin-block: 1rem;
        padding: 1rem 0.5rem;
        min-height: 48vh;
      }

      .header_heading {
        font-weight: 600;
        font-size: 1.45rem;
        margin-bottom: 0.7rem;
      }

      .header_row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .header_title {
        font-weight: 600;
        font-size: 0.75rem;
        padding-left: 0.5rem;
      }

      .header_data {
        border-bottom: 1px dashed black;
        min-width: 5rem;
        text-align: center;
        font-size: 0.6rem;
      }

      .gatepass_body {
        margin-top: 0.8rem;
      }

      .gatepass_body {
        width: 100%;
        background-color: #ebebeb;
        border-radius: 6px;
        display: flex;
        justify-content: start;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding: 0.7rem 0.5rem;
      }

      .data_row_heading {
        font-size: 0.9rem;
        font-weight: 600;
      }

      .data_row_value {
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main class="main">
      <section class="gatepass_01">
        <div class="header">
          <h2 class="header_heading">Stones Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <span class="data_row_heading">T Quantity</span>
            <span class="data_row_value">(${data.T_Quantity}) :</span>
          </div>
        ${
          data.categoryData &&
          data.categoryData.map(
            (item) => `
          <div class="data_row">
            <span class="data_row_heading">${item.category}</span>
            <span class="data_row_value">(${item.color})</span>
            <span class="data_row_value">(${item.quantity})</span>
          </div>
          `
          )
        }
      
        </div>
      </section>

      <section class="gatepass_02">
        <div class="header">
          <h2 class="header_heading">Stones Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <span class="data_row_heading">T Quantity</span>
            <span class="data_row_value">${data.T_Quantity}</span>
          </div>
        ${
          data.categoryData &&
          data.categoryData.map(
            (item) => `
          <div class="data_row">
            <span class="data_row_heading">${item.category}</span>
            <span class="data_row_value">${item.color}</span>
            <span class="data_row_value">${item.quantity}</span>
          </div>
          `
          )
        }
      
        </div>
      </section>
    </main>
  </body>
</html>
`;
        break;
      case data.category === "Stitching":
        htmlContent = `
          <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Naila Arts Gatepass</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html {
                  -webkit-print-color-adjust: exact;
                }

      body {
        font-family: "Poppins", sans-serif;
      }

      input {
        border: none;
      }

      .mr_2 {
        margin-right: 14px;
      }

      .flex_c {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .main {
        width: 100%;
      }

      .gatepass_01,
      .gatepass_02 {
        border: 0.7px solid rgb(150, 150, 150);
        border-radius: 6px;
        margin-inline: 1.5rem;
        margin-block: 1rem;
        padding: 1rem 0.5rem;
        min-height: 48vh;
      }

      .header_heading {
        font-weight: 600;
        font-size: 1.45rem;
        margin-bottom: 0.7rem;
      }

      .header_row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .header_title {
        font-weight: 600;
        font-size: 0.75rem;
        padding-left: 0.5rem;
      }

      .header_data {
        border-bottom: 1px dashed black;
        min-width: 5rem;
        text-align: center;
        font-size: 0.6rem;
      }

      .gatepass_body {
        padding-top: 0.4rem;
      }

      .data_row {
        width: 100%;
        background-color: #ebebeb;
        padding: 0.6rem;
        border-radius: 6px;
        margin-top: 0.6rem;
      }

      .data_row_heading {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
      }

      .row_details {
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }

      .row_details span {
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main class="main">
      <section class="gatepass_01">
        <div class="header">
          <h2 class="header_heading">Stitching Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <p class="data_row_heading">Suit Colors</p>
            ${
              data.suitData &&
              data.suitData.map(
                (item) => ` <div class="row_details">
              <span>${item.category}</span>
              <span>(${item.color})</span>
              <span>(${item.quantity_in_no})</span>
            </div>`
              )
            }
          </div>
          <div class="data_row">
            <p class="data_row_heading">duppapta Colors</p>
            ${
              data.dupattaData &&
              data.dupattaData.map(
                (item) => `<div class="row_details">
              <span>${item.category}</span>
              <span>(${item.color})</span>
              <span>(${item.quantity_in_no})</span>
            </div>`
              )
            }
          </div>
        </div>
      </section>

      <section class="gatepass_02">
        <div class="header">
          <h2 class="header_heading">Stitching Gate pass</h2>
          <div class="header_row">
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Party_Name:</p>
              <p class="header_data">${data.partyName}</p>
            </div>
            <div class="header_box mr_2 flex_c">
              <p class="header_title">Serial No:</p>
              <p class="header_data">${data.serial_No}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Date:</p>
              <p class="header_data">${data.date}</p>
            </div>
            <div class="header_box flex_c">
              <p class="header_title">Design No:</p>
              <p class="header_data">${data.design_no}</p>
            </div>
          </div>
        </div>
        <div class="gatepass_body">
          <div class="data_row">
            <p class="data_row_heading">Suit Colors</p>
           ${
             data.suitData &&
             data.suitData.map(
               (item) => ` <div class="row_details">
              <span>${item.category}</span>
              <span>(${item.color})</span>
              <span>(${item.quantity_in_no})</span>
            </div>`
             )
           }
          </div>
          <div class="data_row">
            <p class="data_row_heading">duppapta Colors</p>
            ${
              data.dupattaData &&
              data.dupattaData.map(
                (item) => `<div class="row_details">
              <span>${item.category}</span>
              <span>(${item.color})</span>
              <span>(${item.quantity_in_no})</span>
            </div>`
              )
            }
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
        break;
      default:
        htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Naila Arts Bill</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap");

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        padding: 0.2rem;
      }

      html {
        -webkit-print-color-adjust: exact;
      }

      body {
        font-family: "Lato", sans-serif;
      }

      .header {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-block: 0.4rem;
      }

      .logo {
        width: 35%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .logo img {
        width: 60%;
      }

      .company_header {
        width: 65%;
        height: 100%;
        padding-left: 2rem;
        border-left: 0.5px solid black;
      }

      .company_header_title {
        font-weight: 500;
        font-size: 1.55rem;
        letter-spacing: 1px;
        margin-bottom: 0.5rem;
      }

      .company_header_slogan {
        background-color: #252525;
        color: white;
        border-radius: 5px;
        padding-block: 0.4rem;
        padding-inline: 0.5rem;
        font-weight: 500;
        font-size: 0.7rem;
        letter-spacing: 1px;
      }

      .company_header_type {
        font-weight: 500;
        font-size: 1.2rem;
        letter-spacing: 1px;
        margin-top: 0.7rem;
      }

      .contact_info {
        margin-top: 0.2rem;
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 1.5rem;
      }

      .contact_info_box {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.3rem;
      }

      .phone_logo {
        height: 20px;
        width: 20px;
      }

      .contact_info_title {
        font-weight: 500;
        font-size: 0.9rem;
        margin-bottom: 0.1rem;
      }

      .contact_info_number {
        font-weight: 500;
        font-size: 0.9rem;
      }

      .mb-1 {
        margin-bottom: 0.1rem;
      }

      .company_details {
        width: 100%;
      }

      .company_details_boxes {
        display: flex;
        justify-content: start;
        align-items: center;
        flex-wrap: wrap;
      }

      .details_input {
        width: 25%;
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 0.2rem;
        margin-bottom: 0.4rem;
      }

      .details_input input {
        border: none;
        outline: none;
        background: transparent;
        padding-top: 0.25rem;
      }

      .details_input input:focus {
        border: none;
        outline: none;
        background: transparent;
      }

      .field_data {
        border-bottom: 1px solid black;
        padding-top: 0.3rem;
      }

      /* table */
      .table-container {
        margin-top: 4px;
        padding: 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead {
        background-color: #f0f0f0;
      }

      thead th {
        border: 1px solid #ddd;
        padding-inline: 8px;
        padding-block: 0.8rem;
        font-size: 0.8rem;
        text-align: left;
      }

      tbody td {
        border: 1px solid #ddd;
        padding-inline: 8px;
        padding-block: 0.8rem;
        font-size: 0.8rem;
      }

      .total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0;
      }

      .bill_text {
        width: 60%;
      }

      .bill_text h2 {
        font-size: 1.1rem;
        font-weight: 500;
      }

      .bill_total {
        width: 40%;
        padding: 0;
      }

      .bill_row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .bill_title {
        border-right: 1px solid #eee;
        width: 100%;
        padding-block: 0.7rem;
        padding-inline: 0.9rem;
      }

      .bill_value {
        text-align: right;
        width: 100%;
        padding-block: 0.7rem;
        padding-inline: 0.9rem;
      }

      .dark_class {
        background-color: #252525;
        color: #fff;
      }

      .account_details {
        width: 100%;
        border-block: 1px solid rgb(194, 194, 194);
        padding-block: 0.5rem;
        margin-top: 1rem;
      }

      .account_details_title {
        font-size: 0.8rem;
        font-weight: 600;
        color: #252525;
        padding-left: 0.5rem;
      }

      .account {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .account_box h3 {
        font-size: 0.8rem;
        font-weight: 500;
      }

      .border-l {
        border-left: 1px solid black;
        padding-left: 2rem;
      }

      .address {
        width: 100%;
        text-align: center;
        padding-block: 1rem;
      }

      .address h2 {
        font-size: 0.8rem;
        font-weight: 500;
        letter-spacing: 1px;
      }

      .dua {
        width: 100%;
        text-align: center;
        padding-block: 0.5rem;
        background-color: #252525;
        color: #fff;
      }

      .dua h2 {
        font-size: 0.8rem;
        font-weight: 500;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="header">
        <!-- logo -->
        <div class="logo">
          <img
            src="https://cdn.shopify.com/s/files/1/0704/6378/2946/files/Naila_1.png?v=1721839653"
            alt="logo"
          />
        </div>

        <!-- company header -->
        <div class="company_header">
          <h2 class="company_header_title">Naila Arts</h2>
          <span class="company_header_slogan">
            ہمارے ہاں ہر قسم کی فینسی رپلیکا کی تمام ورائٹی ہول سیل ریٹ پر
            دستیاب ہے
          </span>
          <p class="company_header_type">ہول سیل ڈیلر</p>

          <div class="contact_info">
            <div class="contact_info_box">
              <img
                class="phone_logo"
                src="https://cdn.shopify.com/s/files/1/0704/6378/2946/files/call.png?v=1723468531"
                alt="phone logo"
              />
              <div class="">
                <h2 class="contact_info_title">Bilal Sheikh</h2>
                <p class="contact_info_number">0324-4103514</p>
                <p class="contact_info_number mb-1">0332-4867447</p>
              </div>
            </div>
            <div class="contact_info_box">
              <img
                class="phone_logo"
                src="https://cdn.shopify.com/s/files/1/0704/6378/2946/files/call.png?v=1723468531"
                alt="phone logo"
              />
              <div class="">
                <h2 class="contact_info_title">Amir Sheikh</h2>
                <p class="contact_info_number">0309-7026733</p>
                <p class="contact_info_number mb-1">0335-4299291</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="company_details">
        <div class="company_details_boxes">
          <div class="details_input">
            <span class="field_title">Serial_No:</span>
            <span class="field_data">${data.serialNumber}</span>
          </div>
          <div class="details_input">
            <span>Name: </span>
            <span class="field_data">${data.name}</span>
          </div>
          <div class="details_input">
            <span>City: </span>
            <span class="field_data">${data.city}</span>
          </div>
          <div class="details_input">
            <span>Cargo: </span>
            <span class="field_data">${data.cargo}</span>
          </div>
          <div class="details_input">
            <span class="text-start">Phone: </span>
            <span class="field_data">${data.phone}</span>
          </div>
          <div class="details_input">
            <span class="text-start">Date: </span>
            <span class="field_data">${data.date}</span>
          </div>
          <div class="details_input">
            <span class="field_title">Bill_By: </span>
            <span class="field_data">${data.bill_by}</span>
          </div>
        </div>
      </section>

      <section class="table-container">
        <table>
          <thead>
            <tr>
              <th>Qty</th>
              <th>Design No</th>
              <th>Colors</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.suits_data
              .map(
                (suit) => `
            <tr>
              <td>${suit.quantity}</td>
              <td>${suit.d_no}</td>
              <td>${suit.color}</td>
              <td>${suit.price}</td>
              <td>${suit.price * suit.quantity}</td>
            </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </section>

      <section class="total">
        <!-- bill text -->
        <div class="bill_text">
          <h2>بل کہ بغیر مال کی واپسی یا تبدیلی نہیں کی جائے گی</h2>
        </div>

        <!-- bill total -->
        <div class="bill_total">
          <div class="bill_row dark_class">
            <div class="bill_title">Total</div>
            <div class="bill_value">${data.total}</div>
          </div>

          <div class="bill_row">
            <div class="bill_title">Discount</div>
            <div class="bill_value">${data.discount}</div>
          </div>

          <div class="bill_row dark_class">
            <div class="bill_title">Advance</div>
            <div class="bill_value">${data.paid}</div>
          </div>

          <div class="bill_row">
            <div class="bill_title">Balance</div>
            <div class="bill_value">${data.remaining}</div>
          </div>
        </div>
      </section>

      <section class="account_details">
        <h2 class="account_details_title">Account Detail :</h2>

        <div class="account">
          <div class="account_box account1">
            <h3>Title: Bilal Khan</h3>
            <h3>Bank: Meezan Bank</h3>
            <h3>Account No: 02820103264090</h3>
          </div>
          <div class="account_box account2 border-l">
            <h3>Title: Bilal Khan</h3>
            <h3>Bank: Jazz Cash</h3>
            <h3>Account No: 0324-4103514</h3>
          </div>
          <div class="account_box account3 border-l">
            <h3>Title: Bilal Khan</h3>
            <h3>Bank: EasyPaisa</h3>
            <h3>Account No: 0332-4867447</h3>
          </div>
        </div>
      </section>
      <section class="address">
        <h2>Address: دوکان نمبر UK-66G سنٹر اعظم کلاتھ مارکیٹ لاہور ۔</h2>
      </section>
      <section class="dua">
        <h2>ہماری دعا ہے ہم سے لئے گئے مال میں آپکے لئے خیر و برکت ہو۔</h2>
      </section>
    </main>
  </body>
</html>
`;
        break;
    }

    await page.setContent(htmlContent);

    // Ensure the page is fully loaded before generating the PDF
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve();
        } else {
          window.addEventListener("load", resolve);
        }
      });
    });

    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    throw new Error(error);
  }
}

export default generatePDF;
