import assert from 'node:assert/strict';
export async function completeReview(page,i,touch=false,label='review'){
 const tap=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(touch)await l.tap();else await l.click();};
 await page.waitForTimeout(1000);
 if(!await page.locator('#review').isVisible())await tap('#review-open');
 await page.waitForTimeout(350);
 const original=await page.evaluate(()=>JSON.stringify([window.__lab.state.mass,window.__lab.state.heat,window.__lab.state.press,window.__lab.state.gases,window.__lab.state.solved]));
 assert.equal(await page.locator('#review-finish').isDisabled(),true);
 await tap('#review-hint');
 if(i===0){await tap('[data-heavy="after"]');assert.ok(await page.locator('#review-finish').isDisabled());await tap('[data-mass="before"]');await tap('[data-mass="after"]');await tap('[data-heavy="after"]');}
 if(i===1){await tap('[data-temp]:nth-child(2)');await page.waitForTimeout(1500);await page.screenshot({path:`qa/${label}-review-hot.png`});await tap('[data-temp]:nth-child(3)');await page.waitForTimeout(1700);}
 if(i===2){await tap('#review-push-tap');await tap('#review-vacuum-tap');}
 if(i===3){await tap('[data-gas="O2"]');await tap('[data-use="He"]');assert.ok(await page.locator('#review-finish').isDisabled());for(const g of ['O2','CO2','N2','He']){await tap(`[data-gas="${g}"]`);await tap(`[data-use="${g}"]`);}}
 await page.waitForTimeout(300);await page.waitForFunction(()=>!window.__lab.transitioning);assert.equal(await page.locator('#review-finish').isDisabled(),false);
 assert.equal(await page.evaluate(()=>JSON.stringify([window.__lab.state.mass,window.__lab.state.heat,window.__lab.state.press,window.__lab.state.gases,window.__lab.state.solved])),original,'Review must not change experimental state');
 await page.screenshot({path:`qa/${label}-review-${i}.png`});await tap('#review-finish');await page.waitForTimeout(400);
 assert.equal(await page.evaluate(i=>window.__lab.learning.done[i],i),true);
}
