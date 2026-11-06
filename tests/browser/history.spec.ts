import {test,expect} from '@playwright/test';
test('예시 검색·목적지 저장, 새로고침 유지, 개별·전체 삭제',async({page})=>{
 await page.goto('/?screen=history');const history=page.getByRole('region',{name:'예시 이용 기록'});await expect(history.getByText('최근 검색이 없어요.')).toBeVisible();
 await page.getByRole('button',{name:'뒤로 가기'}).click();await page.getByRole('textbox',{name:'목적지 검색',exact:true}).fill('중앙도서관');await page.getByRole('button',{name:'검색',exact:true}).click();await page.getByRole('button',{name:/도서관 · 가장 가까운 곳/}).click();
 await page.goto('/?screen=history');await page.reload();await expect(history.getByRole('button',{name:'중앙도서관 다시 검색',exact:true})).toBeVisible();await expect(history.getByRole('button',{name:'중앙도서관 목적지 다시 찾기'})).toBeVisible();
 await history.getByRole('button',{name:'중앙도서관 다시 검색',exact:true}).click();await expect(page.getByRole('heading',{name:'중앙도서관',exact:true})).toBeVisible();
 await page.goto('/?screen=history');await history.getByRole('button',{name:'중앙도서관 검색 기록 삭제'}).click();await page.reload();await expect(history.getByText('최근 검색이 없어요.')).toBeVisible();
 await history.getByRole('button',{name:'전체 삭제',exact:true}).click();await history.getByRole('button',{name:'취소',exact:true}).click();await expect(history.getByRole('button',{name:'중앙도서관 목적지 다시 찾기'})).toBeVisible();
 await history.getByRole('button',{name:'전체 삭제',exact:true}).click();await history.getByRole('button',{name:'모두 삭제하기'}).click();await page.reload();await expect(history.getByText('최근 목적지가 없어요.')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('gilbit.history.v1.demo'))).toBeNull();
});
test('실제 기록은 모의 실제 API 응답 후 저장하고 예시 기록과 섞지 않는다',async({page})=>{
 const place={id:'live-place',name:'긴이름'.repeat(15),address:'서울특별시 중구 '.repeat(12),category:'도서관',lat:37.56,lng:126.97};
 await page.route('**/api/navigation?**',r=>r.fulfill({json:new URL(r.request().url()).searchParams.get('action')==='config'?{searchConfigured:true}:{places:[place]}}));
 await page.goto('/?mode=live');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.getByRole('button',{name:new RegExp('도서관 '+place.name)}).click();
 await page.goto('/?mode=live');await page.getByRole('button',{name:'기록 자세히 보기'}).click();const history=page.getByRole('region',{name:'이용 기록'});await expect(history.getByRole('button',{name:'도서관 다시 검색'})).toBeVisible();
 const raw=await page.evaluate(()=>localStorage.getItem('gilbit.history.v1.live'));expect(raw).not.toContain('lat');expect(raw).not.toContain('lng');
 await page.setViewportSize({width:360,height:844});await history.scrollIntoViewIfNeeded();expect(await history.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:'docs/previews/gilbit-history.png'});
 await history.getByRole('button',{name:`${place.name} 목적지 다시 찾기`}).click();await expect(page.getByRole('heading',{name:place.name,exact:true})).toBeVisible();
 await page.goto('/?mode=live');await page.getByRole('button',{name:'기록 자세히 보기'}).click();await history.getByRole('button',{name:`${place.name} 목적지 기록 삭제`}).click();await page.reload();await page.getByRole('button',{name:'기록 자세히 보기'}).click();await expect(history.getByText('최근 목적지가 없어요.')).toBeVisible();
 await page.goto('/?screen=history');await expect(page.getByRole('region',{name:'예시 이용 기록'}).getByText('최근 검색이 없어요.')).toBeVisible();
});
test('손상된 저장값과 저장 차단 환경에서도 화면이 동작한다',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('gilbit.history.v1.demo','{bad');Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});
 await page.goto('/');await page.getByRole('textbox',{name:'목적지 검색',exact:true}).fill('시청');await page.getByRole('button',{name:'검색',exact:true}).click();await page.getByRole('button',{name:'뒤로 가기'}).click();
 await expect(page.getByRole('alert')).toContainText('기록을 저장하거나 삭제하지 못했어요');await page.getByRole('button',{name:'기록 자세히 보기'}).click();await expect(page.getByRole('button',{name:'시청 다시 검색',exact:true})).toBeVisible();
});

for(const mode of ['demo','live']){
 test(`${mode} 홈은 최근 목적지 1개만 표시하고 전체 기록은 별도 화면으로 이동한다`,async({page})=>{
  await page.addInitScript(mode=>{localStorage.setItem(`gilbit.history.v1.${mode}`,JSON.stringify({version:1,searches:['도서관','시청'],destinations:[{id:'1',name:'최근 장소',address:'새 주소'},{id:'2',name:'이전 장소',address:'이전 주소'}]}));},mode);
  await page.goto(mode==='demo'?'/':'/?mode=live');
  const summary=page.getByRole('region',{name:mode==='demo'?'최근 예시 목적지':'최근 목적지',exact:true});
  await expect(summary.getByRole('button',{name:'최근 장소 목적지 다시 찾기'})).toBeVisible();await expect(summary.getByRole('button',{name:'이전 장소 목적지 다시 찾기'})).toHaveCount(0);await expect(page.getByRole('button',{name:'도서관 다시 검색'})).toHaveCount(0);
  await summary.getByRole('button',{name:'기록 자세히 보기'}).click();const history=page.getByRole('region',{name:mode==='demo'?'예시 이용 기록':'이용 기록',exact:true});
  await expect(history.getByRole('button',{name:'이전 장소 목적지 다시 찾기'})).toBeVisible();await expect(history.getByRole('button',{name:'도서관 다시 검색'})).toBeVisible();
  await history.getByRole('button',{name:'최근 장소 목적지 기록 삭제'}).click();await page.getByRole('button',{name:'뒤로 가기'}).click();await expect(summary.getByRole('button',{name:'이전 장소 목적지 다시 찾기'})).toBeVisible();
 });
}
