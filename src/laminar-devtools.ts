import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

interface ComponentNode {
  element: HTMLElement
  sourcePath: string
  tagName: string
  children: ComponentNode[]
  depth: number
}

@customElement('laminar-devtools')
export class LaminarDevtools extends LitElement {
  @state()
  private componentTree: ComponentNode[] = []

  @state()
  private selectedNode: ComponentNode | null = null

  static styles = css`
    :host {
      display: block;
      font-family: monospace;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      margin: 16px 0;
      max-height: 400px;
      overflow-y: auto;
    }

    .header {
      font-weight: bold;
      margin-bottom: 12px;
      color: #333;
    }

    .tree-node {
      margin: 2px 0;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 2px;
      transition: background-color 0.2s;
    }

    .tree-node:hover {
      background-color: #e0e0e0;
    }

    .tree-node.selected {
      background-color: #007acc;
      color: white;
    }

    .tree-node-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tree-indent {
      display: inline-block;
      width: 16px;
    }

    .tag-name {
      color: #d73a49;
      font-weight: bold;
    }

    .source-path {
      color: #6f42c1;
      font-size: 0.9em;
    }

    .node-info {
      margin-top: 12px;
      padding: 8px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .refresh-btn {
      background: #007acc;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .refresh-btn:hover {
      background: #005a9e;
    }
  `

  connectedCallback() {
    super.connectedCallback()
    this.scanComponentTree()
    
    // Set up a mutation observer to automatically refresh when DOM changes
    const observer = new MutationObserver(() => {
      this.scanComponentTree()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-source-path']
    })
  }

  private scanComponentTree() {
    const rootElements = this.findElementsWithSourcePath(document.body)
    this.componentTree = this.buildTree(rootElements)
  }

  private findElementsWithSourcePath(root: Element): HTMLElement[] {
    const elements: HTMLElement[] = []
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as HTMLElement
          if (element.hasAttribute('data-source-path')) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_SKIP
        }
      }
    )

    let node: Node | null
    while (node = walker.nextNode()) {
      elements.push(node as HTMLElement)
    }

    return elements
  }

  private buildTree(elements: HTMLElement[]): ComponentNode[] {
    const nodes: ComponentNode[] = []
    
    for (const element of elements) {
      const sourcePath = element.getAttribute('data-source-path') || ''
      const node: ComponentNode = {
        element,
        sourcePath,
        tagName: element.tagName.toLowerCase(),
        children: [],
        depth: 0
      }
      nodes.push(node)
    }

    // Build parent-child relationships
    const rootNodes: ComponentNode[] = []
    
    for (const node of nodes) {
      const parent = this.findParentNode(node.element, nodes)
      if (parent) {
        parent.children.push(node)
        node.depth = parent.depth + 1
      } else {
        rootNodes.push(node)
      }
    }

    return rootNodes
  }

  private findParentNode(element: HTMLElement, nodes: ComponentNode[]): ComponentNode | null {
    let parent = element.parentElement
    while (parent) {
      const parentNode = nodes.find(node => node.element === parent)
      if (parentNode) {
        return parentNode
      }
      parent = parent.parentElement
    }
    return null
  }

  private selectNode(node: ComponentNode) {
    this.selectedNode = node
    // Highlight the selected element in the DOM
    this.clearHighlights()
    node.element.style.outline = '2px solid #007acc'
    node.element.style.outlineOffset = '2px'
  }

  private clearHighlights() {
    const highlightedElements = document.querySelectorAll('[style*="outline"]')
    highlightedElements.forEach(el => {
      const element = el as HTMLElement
      element.style.outline = ''
      element.style.outlineOffset = ''
    })
  }

  private renderTreeNode(node: ComponentNode): any {
    const indent = '  '.repeat(node.depth)
    const isSelected = this.selectedNode === node
    
    return html`
      <div 
        class="tree-node ${isSelected ? 'selected' : ''}"
        @click=${() => this.selectNode(node)}
      >
        <div class="tree-node-content">
          <span class="tree-indent">${indent}</span>
          <span class="tag-name">&lt;${node.tagName}&gt;</span>
          <span class="source-path">${node.sourcePath}</span>
        </div>
      </div>
      ${node.children.map(child => this.renderTreeNode(child))}
    `
  }

  private renderSelectedNodeInfo() {
    if (!this.selectedNode) return html``
    
    const node = this.selectedNode
    const rect = node.element.getBoundingClientRect()
    
    return html`
      <div class="node-info">
        <h4>Selected Component</h4>
        <p><strong>Tag:</strong> ${node.tagName}</p>
        <p><strong>Source Path:</strong> ${node.sourcePath}</p>
        <p><strong>Position:</strong> ${Math.round(rect.left)}px, ${Math.round(rect.top)}px</p>
        <p><strong>Size:</strong> ${Math.round(rect.width)}px × ${Math.round(rect.height)}px</p>
        <p><strong>Children:</strong> ${node.children.length}</p>
      </div>
    `
  }

  render() {
    return html`
      <div class="header">
        Laminar Component Tree
        <button class="refresh-btn" @click=${this.scanComponentTree}>
          Refresh
        </button>
      </div>
      
      <div class="tree">
        ${this.componentTree.map(node => this.renderTreeNode(node))}
      </div>
      
      ${this.renderSelectedNodeInfo()}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'laminar-devtools': LaminarDevtools
  }
}
