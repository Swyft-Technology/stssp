import { Order, TenantConfig, Topping, PizzaSize, Category } from '../types';

const getSizeAbbreviation = (size?: PizzaSize) => {
  switch (size) {
    case 'Small': return 'S';
    case 'Medium': return 'M';
    case 'Large': return 'L';
    case 'Family': return 'F';
    default: return '';
  }
};

// UPDATE SIGNATURE: Accept categories as the 4th argument
export const printOrderReceipt = (order: Order, config: TenantConfig, toppings: Topping[], categories: Category[]) => {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;

  // --- NEW SORTING LOGIC ---
  // Create a copy of items to sort without mutating the original order
  const sortedItems = [...order.items].sort((a, b) => {
      const catA = categories.find(c => c.id === a.menuItem.categoryId);
      const catB = categories.find(c => c.id === b.menuItem.categoryId);

      // Default to 999 if no priority set so they go to the bottom
      const priorityA = catA?.ticketPriority ?? 999;
      const priorityB = catB?.ticketPriority ?? 999;

      return priorityA - priorityB;
  });
  // -------------------------
  
  const html = `
      <html>
          <head>
              <title>Receipt ${order.id}</title>
              <style>
                  body { font-family: 'Arial', sans-serif; padding: 10px; font-size: 14px; max-width: 320px; margin: 0 auto; color: black; }
                  .center { text-align: center; }
                  .bold { font-weight: bold; }
                  .header h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: 800; }
                  .header p { margin: 2px 0; font-size: 14px; }
                  .order-meta { margin-top: 15px; margin-bottom: 5px; font-weight: bold; font-size: 16px; }
                  .divider-solid { border-bottom: 2px solid black; margin: 10px 0; }
                  .divider-dashed { border-bottom: 1px dashed black; margin: 10px 0; }
                  .customer-name { font-size: 22px; font-weight: 800; margin: 5px 0; }
                  .items { width: 100%; margin-top: 10px; }
                  .item-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; font-size: 16px; font-weight: 600; gap: 15px; }
                  .mods { font-size: 13px; font-weight: normal; color: #333; margin-left: 10px; margin-bottom: 2px; }
                  .notes { font-size: 13px; font-style: italic; margin-left: 10px; margin-top: 2px; }
                  .total-section { margin-top: 15px; font-size: 16px; }
                  .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                  .final-total { font-size: 22px; font-weight: 800; margin-top: 5px; }
                  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
              </style>
          </head>
          <body>
              <div class="header center">
                  <h1>${config.name}</h1>
                  <p>${config.address || ''}</p>
                  ${config.abn ? `<p>ABN: ${config.abn}</p>` : ''}
                  <p>${new Date(order.timestamp).toLocaleString()}</p>
                  <div class="order-meta">${order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</div>
              </div>
              <div class="divider-solid"></div>
              <div class="customer-name">Name: ${order.customerName}</div>
              ${order.deliveryAddress ? `<div style="font-size:14px; font-weight: bold; margin-bottom: 5px;">${order.deliveryAddress}</div>` : ''}
              ${order.customerPhone ? `<div style="font-size:14px; font-weight: bold;">PH: ${order.customerPhone}</div>` : ''}
              <div class="divider-solid"></div>
              <div class="items">
                  ${sortedItems.map(item => { // USE sortedItems HERE
                      const sizeAbbrev = getSizeAbbreviation(item.selectedSize);
                      const baseOption = item.addedToppings.find(t => t.type === 'BASE_OPTION');
                      const sauceOption = item.addedToppings.find(t => t.type === 'SAUCE_OPTION');
                      const standardToppings = item.addedToppings.filter(t => t.type !== 'BASE_OPTION' && t.type !== 'SAUCE_OPTION');

                      let constructedName = `${item.quantity} x `;
                      if (sizeAbbrev) constructedName += `${sizeAbbrev} `;
                      if (sauceOption) constructedName += `${sauceOption.name} `;
                      if (item.selectedOption) constructedName += `${item.selectedOption.name} `;
                      constructedName += item.menuItem.name;
                      if (baseOption) constructedName += ` (${baseOption.name})`;

                      const sortedSubItems = item.subItems ? [...item.subItems].sort((a, b) => {
                          const idxA = item.menuItem.subItemConfigs?.findIndex(c => c.id === a.configId) ?? 0;
                          const idxB = item.menuItem.subItemConfigs?.findIndex(c => c.id === b.configId) ?? 0;
                          return idxA - idxB;
                      }) : [];
                      
                      const subItemsLine = sortedSubItems.map(s => `<div class="mods">• ${s.item.name} ${s.selectedSize && s.selectedSize !== item.selectedSize ? `(${s.selectedSize})` : ''}</div>`).join('');
                      
                      const standardToppingLines = standardToppings.map(t => {
                          if (t.name.startsWith('Extra Charge')) {
                              return `<div class="mods">- ${t.name.replace('Extra Charge', 'Extra Toppings Charge')}</div>`;
                          }
                          return `<div class="mods">- add ${t.name}</div>`;
                      }).join('');

                      const removedToppingsLines = item.removedToppings.map(id => {
                              const t = toppings.find(top => top.id === id);
                              return t ? `<div class="mods">- NO ${t.name}</div>` : '';
                          }).join('');
                      
                      const notesLine = item.notes ? `<div class="notes">- Note: ${item.notes}</div>` : '';
                      const hasModifiers = subItemsLine || standardToppingLines || removedToppingsLines || notesLine;

                      return `
                      <div>
                          <div class="item-row">
                              <span>${constructedName}</span>
                              <span>$${item.totalPrice.toFixed(2)}</span>
                          </div>
                          ${subItemsLine}
                          ${removedToppingsLines}
                          ${standardToppingLines}
                          ${notesLine}
                          ${hasModifiers ? '<div class="divider-dashed" style="margin: 5px 0; opacity: 0.3;"></div>' : ''}
                      </div>
                  `}).join('')}
              </div>
              <div class="divider-dashed"></div>
              <div class="total-section">
                  <div class="total-row">
                      <span>Subtotal:</span>
                      <span>$${order.subtotal.toFixed(2)}</span>
                  </div>
                  ${order.discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-$${order.discount.toFixed(2)}</span></div>` : ''}
                  <div class="total-row final-total">
                      <span>Total:</span>
                      <span>$${order.total.toFixed(2)}</span>
                  </div>
              </div>
              <div class="footer">SwyftPOS powered by Swyft Tech<br/>swyfttech.com.au</div>
              <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
      </html>
  `;
  win.document.write(html);
  win.document.close();
};