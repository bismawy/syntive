import assert from 'node:assert/strict';
import { canonicalUrl, mergeChildren, collectAllUrls, type TreeNode } from './sync';

// 1. canonicalUrl tests
assert.equal(canonicalUrl('https://github.com/'), 'https://github.com');
assert.equal(canonicalUrl('https://github.com'), 'https://github.com');
assert.equal(canonicalUrl('https://www.github.com/'), 'https://github.com');
assert.equal(canonicalUrl('https://GITHUB.com/user/repo/'), 'https://github.com/user/repo');
assert.equal(canonicalUrl('https://example.com?b=2&a=1'), 'https://example.com?a=1&b=2');
assert.equal(canonicalUrl('https://example.com/?a=1&b=2'), 'https://example.com?a=1&b=2');

// 2. Intra-folder deduplication (trailing slash, www, protocol)
const baseTree: TreeNode[] = [
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Google', url: 'https://google.com/' },
];

const additionsTree: TreeNode[] = [
  { title: 'GitHub Repo', url: 'https://github.com/' }, // duplicate with trailing slash
  { title: 'Google Search', url: 'https://www.google.com' }, // duplicate with www
  { title: 'Hacker News', url: 'https://news.ycombinator.com' }, // genuinely new
];

const merged = mergeChildren(baseTree, additionsTree);
assert.equal(merged.length, 3, 'Should only have 3 items (GitHub, Google, Hacker News), not 5');
assert.equal(merged[0].url, 'https://github.com');
assert.equal(merged[1].url, 'https://google.com/');
assert.equal(merged[2].url, 'https://news.ycombinator.com');

// 3. Folder case & whitespace matching
const baseFolders: TreeNode[] = [
  {
    title: 'Work',
    children: [{ title: 'Jira', url: 'https://jira.company.com' }],
  },
];

const localFolders: TreeNode[] = [
  {
    title: 'work ', // lowercase + trailing space
    children: [
      { title: 'Jira Cloud', url: 'https://jira.company.com/' }, // duplicate
      { title: 'Slack', url: 'https://slack.com' }, // new
    ],
  },
];

const mergedFolders = mergeChildren(baseFolders, localFolders);
assert.equal(mergedFolders.length, 1, 'Should merge into 1 "Work" folder, not duplicate folder');
assert.equal(mergedFolders[0].title, 'Work');
assert.equal(mergedFolders[0].children?.length, 2, 'Work folder should have Jira and Slack, not duplicate Jira');

// 4. Cross-folder deduplication on initial sync (globalUrls)
const cloudTreeWithSubfolder: TreeNode[] = [
  {
    title: 'Development',
    children: [{ title: 'GitHub', url: 'https://github.com' }],
  },
];

const localRootBookmarks: TreeNode[] = [
  { title: 'My GitHub', url: 'https://github.com/' }, // already exists in Dev folder in cloud!
  { title: 'MDN', url: 'https://developer.mozilla.org' }, // genuinely new
];

const globalCloudUrls = collectAllUrls(cloudTreeWithSubfolder);
assert.equal(globalCloudUrls.has('https://github.com'), true);

const mergedCrossFolder = mergeChildren(cloudTreeWithSubfolder, localRootBookmarks, globalCloudUrls);
assert.equal(mergedCrossFolder.length, 2, 'Should keep Development folder and only add MDN to root');
assert.equal(mergedCrossFolder.some((n) => n.url === 'https://github.com/'), false, 'Should NOT duplicate GitHub to root');
assert.equal(mergedCrossFolder.some((n) => n.url === 'https://developer.mozilla.org'), true, 'Should add MDN to root');

console.log('sync deduplication and merge self-check OK');
