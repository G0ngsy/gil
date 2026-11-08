import {test,expect} from '@playwright/test';
test('키나 위치 권한 없이 모의 이동·이탈·복귀·도착을 확인한다',async({page})=>{
 let apiCalls=0;page.on('request',r=>{if(r.url().includes('api/navigation')||r.url().includes('openapi.sk.com'))apiCalls++;});
 await page.goto('/?mode=simulation');await expect(page.getByText('모의 GPS · 예시 경로입니다.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'출발',exact:true}).click();await expect(page.getByTestId('remaining')).toHaveText('300m');
 await page.getByRole('button',{name:'직진 이동',exact:true}).click();await expect(page.getByTestId('remaining')).not.toHaveText('300m');
 await page.getByRole('button',{name:'회전 지점',exact:true}).click();await expect(page.getByText('안내 단계 2 / 3')).toBeVisible();
 await page.getByRole('button',{name:'경로 이탈',exact:true}).click();await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
 await page.getByRole('button',{name:'경로 복귀',exact:true}).click();await expect(page.getByText('안내 단계 3 / 3')).toBeVisible();
 await page.getByRole('textbox',{name:'오차(m)'}).fill('100');await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.getByRole('textbox',{name:'오차(m)'}).fill('5');await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();await expect(page.getByTestId('remaining')).toHaveText('0m');
 await page.getByRole('button',{name:'추적 초기화'}).click();await expect(page.getByTestId('remaining')).toHaveText('300m');expect(apiCalls).toBe(0);
});
