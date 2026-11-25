import type {Page} from '@playwright/test';
/** 안내 상세에 접근할 때 사용자가 시트를 펼치는 동작을 재현합니다. */
export async function expandJourney(page:Page){const toggle=page.getByRole('button',{name:'안내 정보 펼치기',exact:true});if(await toggle.isVisible())await toggle.click();}
